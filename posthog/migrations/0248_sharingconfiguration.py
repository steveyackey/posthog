# Generated by Django 3.2.13 on 2022-06-27 13:58

from django.db import migrations, models
import django.db.models.deletion
import posthog.models.sharing_configuration


class Migration(migrations.Migration):

    dependencies = [
        ('posthog', '0247_feature_flags_experience_continuity'),
    ]

    operations = [
        migrations.CreateModel(
            name='SharingConfiguration',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('enabled', models.BooleanField(default=False)),
                ('access_token', models.CharField(blank=True, default=posthog.models.sharing_configuration.get_default_access_token, max_length=400, null=True, unique=True)),
                ('dashboard', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='posthog.dashboard')),
                ('insight', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='posthog.insight')),
                ('team', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='posthog.team')),
            ],
        ),
    ]
