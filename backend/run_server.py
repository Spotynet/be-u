#!/usr/bin/env python
"""
Script para ejecutar Django en el puerto 3000
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    django.setup()
    
    # Ejecutar el servidor en el puerto 8000
    execute_from_command_line(['manage.py', 'runserver', '8000'])
