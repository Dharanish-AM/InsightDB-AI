import asyncio
import os
import random
from datetime import datetime, timedelta
import asyncpg
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

# Imports from app
from app.core.encryption import encrypt_string
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.database_connection import DatabaseConnection, DbType
from app.repositories.connection_repository import ConnectionRepository
from app.repositories.schema_repository import SchemaRepository
from app.repositories.user_repository import UserRepository
from app.services.schema_service import SchemaService

POSTGRES_USER = os.getenv("POSTGRES_USER", "insightdb")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "insightdb_pass")
POSTGRES_HOST = "postgres"
POSTGRES_PORT = 5432

SYSTEM_DB_URL = f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/insightdb_dev"
METROPOLIS_DB_NAME = "metropolis_parking_db"
METROPOLIS_DB_URL = f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{METROPOLIS_DB_NAME}"


async def create_database_if_not_exists():
    print(f"Connecting to Postgres host to check database '{METROPOLIS_DB_NAME}'...")
    conn = await asyncpg.connect(
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database="postgres"
    )
    try:
        db_exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", METROPOLIS_DB_NAME
        )
        if not db_exists:
            print(f"Creating database '{METROPOLIS_DB_NAME}'...")
            await conn.execute(f'CREATE DATABASE "{METROPOLIS_DB_NAME}"')
            print(f"Database '{METROPOLIS_DB_NAME}' created successfully.")
        else:
            print(f"Database '{METROPOLIS_DB_NAME}' already exists.")
    finally:
        await conn.close()


async def seed_metropolis_tables():
    print("Connecting to Metropolis Parking DB to create tables and seed data...")

    # Execute multi-statement DDL via raw asyncpg connection
    raw_conn = await asyncpg.connect(
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=METROPOLIS_DB_NAME
    )
    try:
        create_tables_sql = """
        DROP TABLE IF EXISTS payments CASCADE;
        DROP TABLE IF EXISTS parking_reservations CASCADE;
        DROP TABLE IF EXISTS vehicles CASCADE;
        DROP TABLE IF EXISTS drivers CASCADE;
        DROP TABLE IF EXISTS parking_spots CASCADE;
        DROP TABLE IF EXISTS parking_locations CASCADE;

        CREATE TABLE parking_locations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            address VARCHAR(255) NOT NULL,
            city VARCHAR(100) NOT NULL DEFAULT 'Metropolis',
            capacity INT NOT NULL,
            hourly_rate DECIMAL(10,2) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE parking_spots (
            id SERIAL PRIMARY KEY,
            location_id INT REFERENCES parking_locations(id) ON DELETE CASCADE,
            spot_number VARCHAR(20) NOT NULL,
            spot_type VARCHAR(50) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'Available',
            is_covered BOOLEAN DEFAULT TRUE,
            floor_level INT DEFAULT 1
        );

        CREATE TABLE drivers (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(150) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            phone VARCHAR(50),
            membership_tier VARCHAR(50) DEFAULT 'Standard',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE vehicles (
            id SERIAL PRIMARY KEY,
            driver_id INT REFERENCES drivers(id) ON DELETE CASCADE,
            license_plate VARCHAR(30) UNIQUE NOT NULL,
            make VARCHAR(50) NOT NULL,
            model VARCHAR(50) NOT NULL,
            vehicle_type VARCHAR(50) NOT NULL
        );

        CREATE TABLE parking_reservations (
            id SERIAL PRIMARY KEY,
            driver_id INT REFERENCES drivers(id) ON DELETE CASCADE,
            vehicle_id INT REFERENCES vehicles(id) ON DELETE CASCADE,
            location_id INT REFERENCES parking_locations(id) ON DELETE CASCADE,
            spot_id INT REFERENCES parking_spots(id) ON DELETE CASCADE,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'Completed',
            payment_status VARCHAR(50) NOT NULL DEFAULT 'Paid',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE payments (
            id SERIAL PRIMARY KEY,
            reservation_id INT REFERENCES parking_reservations(id) ON DELETE CASCADE,
            payment_method VARCHAR(50) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            transaction_status VARCHAR(50) NOT NULL DEFAULT 'Success',
            paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        await raw_conn.execute(create_tables_sql)
    finally:
        await raw_conn.close()

    engine = create_async_engine(METROPOLIS_DB_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        # 1. Seed Locations
        locations_data = [
            ("Metropolis Downtown Central Garage", "100 Grand Avenue", "Metropolis", 250, 8.50),
            ("Metropolis International Airport Terminal Hub", "500 Airport Way", "Metropolis", 600, 12.00),
            ("Financial District Towers Parking", "45 Wall Street", "Metropolis", 180, 15.00),
            ("Suburban Plaza Shopping Garage", "88 Parkside Boulevard", "Metropolis", 300, 5.00),
            ("Metropolis General Hospital Deck", "12 Medical Center Drive", "Metropolis", 200, 6.00),
            ("Tech Quarter Innovation Hub Lot", "770 Cyber Tech Way", "Metropolis", 150, 10.00),
        ]
        
        location_ids = []
        for name, addr, city, cap, rate in locations_data:
            res = await session.execute(
                text("INSERT INTO parking_locations (name, address, city, capacity, hourly_rate) VALUES (:name, :addr, :city, :cap, :rate) RETURNING id"),
                {"name": name, "addr": addr, "city": city, "cap": cap, "rate": rate}
            )
            location_ids.append(res.scalar_one())

        # 2. Seed Spots
        spot_types = ["Standard", "EV Charging", "Handicap", "VIP", "Compact"]
        statuses = ["Available", "Occupied", "Reserved", "Maintenance"]
        spot_ids = []

        for loc_id in location_ids:
            for floor in range(1, 4):
                for num in range(1, 15):
                    stype = random.choice(spot_types)
                    status_val = random.choices(statuses, weights=[60, 25, 10, 5])[0]
                    spot_num = f"F{floor}-{num:02d}"
                    res = await session.execute(
                        text("INSERT INTO parking_spots (location_id, spot_number, spot_type, status, is_covered, floor_level) VALUES (:loc_id, :spot_num, :stype, :status_val, :is_covered, :floor) RETURNING id"),
                        {"loc_id": loc_id, "spot_num": spot_num, "stype": stype, "status_val": status_val, "is_covered": True, "floor": floor}
                    )
                    spot_ids.append((res.scalar_one(), loc_id))

        # 3. Seed Drivers
        first_names = ["James", "Emma", "Liam", "Olivia", "Noah", "Ava", "William", "Sophia", "Lucas", "Isabella", "Ethan", "Mia", "Alexander", "Charlotte", "Daniel", "Amelia", "Matthew", "Harper", "Henry", "Evelyn"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
        membership_tiers = ["Standard", "Silver", "Gold", "Platinum"]

        driver_ids = []
        for i in range(50):
            fn = random.choice(first_names)
            ln = random.choice(last_names)
            full_name = f"{fn} {ln}"
            email = f"{fn.lower()}.{ln.lower()}{i+1}@metropolisparking.com"
            phone = f"+1-555-{random.randint(100,999):03d}-{random.randint(1000,9999):04d}"
            tier = random.choices(membership_tiers, weights=[50, 25, 15, 10])[0]

            res = await session.execute(
                text("INSERT INTO drivers (full_name, email, phone, membership_tier) VALUES (:fn, :email, :phone, :tier) RETURNING id"),
                {"fn": full_name, "email": email, "phone": phone, "tier": tier}
            )
            driver_ids.append(res.scalar_one())

        # 4. Seed Vehicles
        makes_models = [
            ("Tesla", "Model 3", "EV"),
            ("Tesla", "Model Y", "EV"),
            ("Toyota", "Camry", "Sedan"),
            ("Toyota", "RAV4", "SUV"),
            ("Honda", "Civic", "Sedan"),
            ("Ford", "F-150", "Truck"),
            ("BMW", "3 Series", "Sedan"),
            ("Mercedes-Benz", "GLC", "SUV"),
            ("Audi", "e-tron", "EV"),
            ("Chevrolet", "Tahoe", "SUV"),
        ]

        vehicle_ids = []
        for driver_id in driver_ids:
            num_vehicles = random.choice([1, 1, 2])
            for _ in range(num_vehicles):
                make, model, vtype = random.choice(makes_models)
                plate = f"MP-{random.randint(10,99)}-{chr(random.randint(65,90))}{chr(random.randint(65,90))}{random.randint(10,99)}"
                try:
                    res = await session.execute(
                        text("INSERT INTO vehicles (driver_id, license_plate, make, model, vehicle_type) VALUES (:driver_id, :plate, :make, :model, :vtype) RETURNING id"),
                        {"driver_id": driver_id, "plate": plate, "make": make, "model": model, "vtype": vtype}
                    )
                    vehicle_ids.append((res.scalar_one(), driver_id))
                except Exception:
                    pass

        await session.commit()

        # 5. Seed Reservations & Payments
        now = datetime.now()
        payment_methods = ["Credit Card", "Apple Pay", "Google Pay", "Metropolis Wallet"]

        for _ in range(250):
            veh_id, d_id = random.choice(vehicle_ids)
            spot_id, loc_id = random.choice(spot_ids)

            days_ago = random.randint(0, 60)
            hours_ago = random.randint(0, 23)
            duration_hours = random.choice([1, 2, 3, 4, 5, 8, 12, 24])

            start_time = now - timedelta(days=days_ago, hours=hours_ago)
            end_time = start_time + timedelta(hours=duration_hours)

            loc_rate = 10.0
            if loc_id == 1: loc_rate = 8.50
            elif loc_id == 2: loc_rate = 12.00
            elif loc_id == 3: loc_rate = 15.00
            elif loc_id == 4: loc_rate = 5.00
            elif loc_id == 5: loc_rate = 6.00

            total_amt = round(duration_hours * loc_rate, 2)
            status_val = random.choices(["Completed", "Active", "Cancelled", "No Show"], weights=[80, 10, 5, 5])[0]
            pay_status = "Paid" if status_val in ["Completed", "Active"] else ("Refunded" if status_val == "Cancelled" else "Pending")

            res = await session.execute(
                text("INSERT INTO parking_reservations (driver_id, vehicle_id, location_id, spot_id, start_time, end_time, total_amount, status, payment_status, created_at) VALUES (:d_id, :v_id, :l_id, :s_id, :start, :end, :amt, :status, :pay_status, :created) RETURNING id"),
                {
                    "d_id": d_id, "v_id": veh_id, "l_id": loc_id, "s_id": spot_id,
                    "start": start_time, "end": end_time, "amt": total_amt,
                    "status": status_val, "pay_status": pay_status, "created": start_time
                }
            )
            res_id = res.scalar_one()

            if pay_status in ["Paid", "Refunded"]:
                pmethod = random.choice(payment_methods)
                tx_status = "Success" if pay_status == "Paid" else "Refunded"
                await session.execute(
                    text("INSERT INTO payments (reservation_id, payment_method, amount, transaction_status, paid_at) VALUES (:res_id, :pm, :amt, :tx, :paid_at)"),
                    {"res_id": res_id, "pm": pmethod, "amt": total_amt, "tx": tx_status, "paid_at": start_time}
                )

        await session.commit()
        print("Successfully seeded Metropolis Parking tables, spots, drivers, vehicles, reservations, and payments!")


async def register_connection_in_insightdb():
    print("Registering Metropolis Parking DB in InsightDB AI System Database...")
    system_engine = create_async_engine(SYSTEM_DB_URL)
    system_session = async_sessionmaker(system_engine, expire_on_commit=False)

    async with system_session() as session:
        conn_repo = ConnectionRepository(session)
        user_repo = UserRepository(session)
        schema_repo = SchemaRepository(session)

        # Get or create admin/primary user
        users = await user_repo.get_all()
        if not users:
            admin_user = User(
                email="admin@insightdb.ai",
                hashed_password=get_password_hash("password123"),
                full_name="InsightDB Administrator",
                role=UserRole.ADMIN,
                is_active=True
            )
            session.add(admin_user)
            await session.commit()
            await session.refresh(admin_user)
            owner_id = admin_user.id
            users = [admin_user]
        else:
            owner_id = users[0].id

        # Check existing connection for all registered users so it registers for everyone
        for u in users:
            existing = await conn_repo.get_by_owner(u.id)
            metropolis_conn = next((c for c in existing if c.database_name == METROPOLIS_DB_NAME), None)

            if not metropolis_conn:
                print(f"Creating DatabaseConnection record for user {u.email}...")
                metropolis_conn = DatabaseConnection(
                    name="Metropolis Parking Production DB",
                    db_type=DbType.POSTGRESQL,
                    host=POSTGRES_HOST,
                    port=5432,
                    database_name=METROPOLIS_DB_NAME,
                    username=POSTGRES_USER,
                    encrypted_password=encrypt_string(POSTGRES_PASSWORD),
                    owner_id=u.id,
                    is_active=True
                )
                session.add(metropolis_conn)
                await session.commit()
                await session.refresh(metropolis_conn)
                print(f"Registered connection ID {metropolis_conn.id} for user {u.email}")
            else:
                # Make sure existing record has valid encrypted password
                metropolis_conn.encrypted_password = encrypt_string(POSTGRES_PASSWORD)
                session.add(metropolis_conn)
                await session.commit()

            print(f"Syncing schema metadata for Metropolis Parking connection (ID: {metropolis_conn.id})...")
            schema_service = SchemaService(schema_repo, conn_repo)
            synced_res = await schema_service.sync_connection_schema(metropolis_conn.id, u.id)
            print(f"Schema sync completed for user {u.email}! Synced {synced_res.tables_synced} tables.")


async def main():
    await create_database_if_not_exists()
    await seed_metropolis_tables()
    await register_connection_in_insightdb()
    print("\n--- METROPOLIS PARKING SEEDING COMPLETE ---")


if __name__ == "__main__":
    asyncio.run(main())
