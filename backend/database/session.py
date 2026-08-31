"""
SQLite Database Layer for Block Planner.
Provides connection, table initialization, and schema management.
"""
import sqlite3
import json
import os
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "railopt.db")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA busy_timeout=30000;")
    
    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS stations (
        station_code TEXT PRIMARY KEY,
        station_name TEXT NOT NULL,
        station_type TEXT NOT NULL,
        division TEXT NOT NULL,
        zone TEXT NOT NULL,
        location TEXT,
        latitude REAL,
        longitude REAL,
        platforms INTEGER DEFAULT 2,
        lines INTEGER DEFAULT 4,
        electrified TEXT DEFAULT 'Yes',
        status TEXT DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS sections (
        section_id TEXT PRIMARY KEY,
        from_station TEXT NOT NULL,
        to_station TEXT NOT NULL,
        from_code TEXT,
        to_code TEXT,
        distance_km REAL NOT NULL,
        tracks_count INTEGER DEFAULT 2,
        electrified TEXT DEFAULT 'Yes',
        max_speed_kmh INTEGER DEFAULT 130,
        permitted_block_duration REAL DEFAULT 4.0,
        status TEXT DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS maintenance_tasks (
        task_id TEXT PRIMARY KEY,
        department TEXT NOT NULL,
        asset_id TEXT NOT NULL,
        section TEXT NOT NULL,
        location TEXT NOT NULL,
        task_type TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT NOT NULL,
        asset_criticality TEXT NOT NULL,
        due_date TEXT NOT NULL,
        overdue_days INTEGER DEFAULT 0,
        estimated_duration_hours REAL NOT NULL,
        required_team TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        requires_power_block INTEGER DEFAULT 0,
        requires_traffic_block INTEGER DEFAULT 1,
        priority_score REAL DEFAULT 0.0,
        priority_level TEXT DEFAULT 'Medium',
        score_reasons TEXT,
        score_breakdown TEXT
    );

    CREATE TABLE IF NOT EXISTS trains (
        train_id TEXT PRIMARY KEY,
        train_number TEXT NOT NULL,
        train_name TEXT NOT NULL,
        train_type TEXT NOT NULL,
        origin_station TEXT,
        destination_station TEXT,
        section TEXT NOT NULL,
        arrival_time TEXT NOT NULL,
        departure_time TEXT NOT NULL,
        date TEXT DEFAULT '2026-08-30',
        priority INTEGER DEFAULT 2,
        priority_label TEXT DEFAULT 'High',
        direction TEXT DEFAULT 'Down',
        running_status TEXT DEFAULT 'Scheduled',
        expected TEXT DEFAULT 'On Time',
        remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS goods_forecasts (
        forecast_id TEXT PRIMARY KEY,
        section TEXT NOT NULL,
        expected_start_time TEXT NOT NULL,
        expected_end_time TEXT NOT NULL,
        probability REAL NOT NULL,
        traffic_level TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS block_availability (
        block_id TEXT PRIMARY KEY,
        section TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        maximum_duration REAL NOT NULL,
        status TEXT DEFAULT 'Available'
    );

    CREATE TABLE IF NOT EXISTS recommendations (
        recommendation_id TEXT PRIMARY KEY,
        block_id TEXT NOT NULL,
        section TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        duration_hours REAL NOT NULL,
        priority_level TEXT NOT NULL,
        optimization_score REAL NOT NULL,
        train_impact_score REAL NOT NULL,
        affected_trains_count INTEGER NOT NULL,
        affected_trains_json TEXT,
        goods_probability REAL NOT NULL,
        reasons_json TEXT,
        score_breakdown_json TEXT,
        status TEXT DEFAULT 'Proposed'
    );

    CREATE TABLE IF NOT EXISTS recommendation_tasks (
        recommendation_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        PRIMARY KEY (recommendation_id, task_id)
    );

    CREATE TABLE IF NOT EXISTS recommended_blocks (
        recommendation_id TEXT PRIMARY KEY,
        section TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        duration_hours REAL NOT NULL,
        departments TEXT,
        tasks TEXT,
        affected_trains TEXT,
        train_impact_score REAL DEFAULT 0.0,
        reasons TEXT,
        status TEXT DEFAULT 'Accepted'
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)
    
    conn.commit()
    conn.close()
