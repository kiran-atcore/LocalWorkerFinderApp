from django.db import migrations, transaction

def create_missing_tables(apps, schema_editor):
    Review = apps.get_model('users', 'Review')
    UserDevice = apps.get_model('users', 'UserDevice')
    BlockedUser = apps.get_model('users', 'BlockedUser')
    for model in [Review, UserDevice, BlockedUser]:
        try:
            with transaction.atomic():
                schema_editor.create_model(model)
        except Exception:
            pass

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(create_missing_tables, reverse_code=migrations.RunPython.noop),
    ]
