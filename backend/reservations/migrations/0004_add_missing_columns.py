# Manual migration to add missing columns if they don't exist

from django.db import migrations


def add_missing_columns(apps, schema_editor):
    """Add any missing columns that might not have been created"""
    with schema_editor.connection.cursor() as cursor:
        # Check and add provider_content_type_id if missing
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='reservations_reservation' AND column_name='provider_content_type_id'
                ) THEN
                    ALTER TABLE reservations_reservation 
                    ADD COLUMN provider_content_type_id INTEGER REFERENCES django_content_type(id) ON DELETE CASCADE;
                END IF;
            END $$;
        """)
        
        # Check and add provider_object_id if missing
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='reservations_reservation' AND column_name='provider_object_id'
                ) THEN
                    ALTER TABLE reservations_reservation 
                    ADD COLUMN provider_object_id INTEGER NOT NULL DEFAULT 0;
                END IF;
            END $$;
        """)
        
        # Check and add service_instance_type_id if missing
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='reservations_reservation' AND column_name='service_instance_type_id'
                ) THEN
                    ALTER TABLE reservations_reservation 
                    ADD COLUMN service_instance_type_id INTEGER REFERENCES django_content_type(id) ON DELETE CASCADE;
                END IF;
            END $$;
        """)
        
        # Check and add service_instance_id if missing
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='reservations_reservation' AND column_name='service_instance_id'
                ) THEN
                    ALTER TABLE reservations_reservation 
                    ADD COLUMN service_instance_id INTEGER;
                END IF;
            END $$;
        """)
        
        # Check and add duration if missing
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='reservations_reservation' AND column_name='duration'
                ) THEN
                    ALTER TABLE reservations_reservation 
                    ADD COLUMN duration INTERVAL;
                END IF;
            END $$;
        """)
        
        # Check and add notes if missing
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='reservations_reservation' AND column_name='notes'
                ) THEN
                    ALTER TABLE reservations_reservation 
                    ADD COLUMN notes TEXT;
                END IF;
            END $$;
        """)
        
        # Check and add cancellation_reason if missing
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='reservations_reservation' AND column_name='cancellation_reason'
                ) THEN
                    ALTER TABLE reservations_reservation 
                    ADD COLUMN cancellation_reason TEXT;
                END IF;
            END $$;
        """)
        
        # Check and add rejection_reason if missing
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='reservations_reservation' AND column_name='rejection_reason'
                ) THEN
                    ALTER TABLE reservations_reservation 
                    ADD COLUMN rejection_reason TEXT;
                END IF;
            END $$;
        """)


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0003_alter_reservation_place_and_more'),
    ]

    operations = [
        migrations.RunPython(add_missing_columns, reverse_code=migrations.RunPython.noop),
    ]





















































