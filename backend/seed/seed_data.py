# Seed data generator for Block Planner
import sqlite3, os, sys, json
backend_dir = r"C:\Users\LENOVO\.gemini\antigravity\scratch\railopt-ai\backend"
if backend_dir not in sys.path: sys.path.insert(0, backend_dir)
from database.session import get_connection, init_db

def seed_database():
    init_db()
    conn = get_connection()
    c = conn.cursor()
    
    c.execute("DELETE FROM stations")
    c.execute("DELETE FROM sections")
    c.execute("DELETE FROM maintenance_tasks")
    c.execute("DELETE FROM trains")
    c.execute("DELETE FROM goods_forecasts")
    c.execute("DELETE FROM block_availability")
    c.execute("DELETE FROM recommendations")
    c.execute("DELETE FROM recommendation_tasks")

    # 1. Stations
    stations = [
        ("SC", "Secunderabad", "Junction", "Secunderabad", "South Central Railway", "Hyderabad, Telangana", 17.4344, 78.5015, 10, 8, "Yes", "Active"),
        ("KZJ", "Kazipet", "Junction", "Secunderabad", "South Central Railway", "Hanamkonda, Telangana", 17.9786, 79.5222, 6, 6, "Yes", "Active"),
        ("WL", "Warangal", "Major", "Secunderabad", "South Central Railway", "Warangal, Telangana", 17.9689, 79.5941, 4, 4, "Yes", "Active"),
        ("BZA", "Vijayawada", "Junction", "Vijayawada", "South Central Railway", "Vijayawada, Andhra Pradesh", 16.5186, 80.6195, 10, 8, "Yes", "Active"),
        ("GNT", "Guntur", "Junction", "Guntur", "South Central Railway", "Guntur, Andhra Pradesh", 16.3067, 80.4365, 7, 5, "Yes", "Active"),
        ("DKJ", "Dornakal", "Junction", "Secunderabad", "South Central Railway", "Mahabubabad, Telangana", 17.4522, 80.1511, 3, 4, "Yes", "Active"),
        ("ZN", "Jangaon", "Intermediate", "Secunderabad", "South Central Railway", "Jangaon, Telangana", 17.7214, 79.1622, 3, 3, "Yes", "Active"),
        ("BG", "Bhongir", "Intermediate", "Secunderabad", "South Central Railway", "Yadadri Bhuvanagiri", 17.5123, 78.8891, 3, 3, "Yes", "Active"),
        ("KMT", "Khammam", "Major", "Secunderabad", "South Central Railway", "Khammam, Telangana", 17.2473, 80.1514, 3, 4, "Yes", "Active"),
    ]
    for s in stations:
        c.execute("""INSERT INTO stations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", s)

    # 2. Sections
    sections = [
        ("SC-KZJ", "Secunderabad", "Kazipet", "SC", "KZJ", 132.0, 2, "Yes", 130, 4.0, "Active"),
        ("KZJ-WL", "Kazipet", "Warangal", "KZJ", "WL", 15.0, 3, "Yes", 130, 2.5, "Active"),
        ("WL-BZA", "Warangal", "Vijayawada", "WL", "BZA", 207.0, 2, "Yes", 130, 4.0, "Active"),
        ("BZA-GNT", "Vijayawada", "Guntur", "BZA", "GNT", 32.0, 2, "Yes", 110, 3.0, "Active"),
    ]
    for sec in sections:
        c.execute("""INSERT INTO sections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", sec)

    # 3. Maintenance Tasks
    tasks = [
        ("TMS-001","Engineering","TRK-WL-142","WL-BZA","Km 142/10-14 Up Main","USFD Rail Flaw Defect","Urgent IMR rail flaw detected during ultrasonic testing.","Critical","Critical","2026-08-28",3,2.0,"P-Way Gang 04 (Warangal)","Overdue",0,1),
        ("TDMS-001","Traction","OHE-WL-143","WL-BZA","Km 143/02-08 Up Line","OHE Cantilever Overhaul","Cantilever insulator flashover observed; requires contact wire alignment.","High","High","2026-08-29",2,1.0,"TRD Tower Wagon Unit A","Overdue",1,1),
        ("SMMS-001","Signal & Telecom","SIG-WL-108","WL-BZA","Dornakal Jn Facing Point 108B","Point Machine Overhaul","High friction and timing deviation on Point Machine 108B.","High","High","2026-08-30",1,1.0,"S&T Signal Unit 02","Pending",0,1),
        ("TMS-002","Engineering","TRK-WL-180","WL-BZA","Km 180/04-20 Dn Main","Track Tamping & Lining","Post-monsoon alignment correction and ballast consolidation.","Medium","Medium","2026-09-02",0,3.0,"Track Machine Tamping Unit 9","Pending",0,1),
        ("TDMS-002","Traction","OHE-BZA-202","WL-BZA","Khammam - Chintakani Section","Dropper Renewal & OHE Height","Replace corroded copper droppers and calibrate contact wire gradient.","Medium","Medium","2026-09-04",0,1.5,"TRD Maintenance Gang B","Pending",1,1),
        ("SMMS-002","Signal & Telecom","SIG-BZA-31","WL-BZA","Vijayawada Outer Approach 31T","Digital Axle Counter Test","Periodic reset verification and track sensor coil tuning.","Low","High","2026-09-06",0,1.0,"S&T Tele Gang 01","Pending",0,0),
        ("TMS-003","Engineering","TRK-SEC-044","SEC-KZJ","Km 44/12-16 Moula Ali - Ghatkesar","Thermit Weld Fracture Repair","Emergency clamp placed on micro-crack weld; requires cut rail insert.","Critical","Critical","2026-08-27",4,2.5,"P-Way Welding Gang 01","Overdue",0,1),
        ("TDMS-003","Traction","OHE-SEC-055","SEC-KZJ","Bhongir Neutral Section","PTFE Neutral Section Overhaul","Erosion on ceramic PTFE insulator rod; flashover hazard.","Critical","High","2026-08-28",3,2.0,"TRD Special Breakdown Crew","Overdue",1,1),
        ("SMMS-003","Signal & Telecom","SIG-SEC-092","SEC-KZJ","Aler Route Relay Interlocking","Relay Interlocking Contact Check","Intermittent circuit drop on Down Home signal route 3A.","High","High","2026-08-30",1,1.5,"S&T Interlocking Crew 03","Pending",0,1),
        ("TMS-004","Engineering","TRK-SEC-088","SEC-KZJ","Km 88/02-18 Jangaon Yard","Deep Screening of Ballast","Ballast fouling index exceeds 45%; automated BCM required.","Medium","High","2026-09-05",0,4.0,"Ballast Cleaning Machine Gang","Pending",0,1),
        ("TDMS-004","Traction","OHE-SEC-110","SEC-KZJ","Kazipet Outer Grid Feed","25kV Isolator Switch Service","Routine greasing and contact clearance measurement on isolator.","Low","Medium","2026-09-08",0,1.0,"TRD Maintenance Gang A","Pending",1,0),
        ("SMMS-004","Signal & Telecom","SIG-SEC-060","SEC-KZJ","LC Gate 32 Interlocking","Boom Barrier Limit Switch Calibration","Intermittent gate locking confirmation delay during heavy road traffic.","Medium","Medium","2026-09-01",0,1.0,"S&T Field Gang 04","Pending",0,1),
        ("TMS-005","Engineering","TRK-KZJ-008","KZJ-WL","Kazipet Jn Diamond Crossing #2","Diamond Crossing Nose Re-conditioning","Excessive gauge face wear (7.8mm) on CMS crossing.","Critical","Critical","2026-08-26",5,2.0,"P-Way Heavy Gang 02","Overdue",0,1),
        ("TDMS-005","Traction","OHE-KZJ-004","KZJ-WL","Km 04/08 Junction Bypass","OHE Section Insulator Adjustment","Stagger variation exceeding standard tolerance (+120mm).","High","High","2026-08-29",2,1.5,"TRD Tower Wagon Unit B","Overdue",1,1),
        ("SMMS-005","Signal & Telecom","SIG-KZJ-112","KZJ-WL","Warangal West Cabin Interlocking 112","Electronic Interlocking Board Replacement","Card redundancy failure on standby central processing unit (CPU 2).","Critical","Critical","2026-08-28",3,2.0,"S&T Specialist EI Team","Overdue",0,1),
        ("TMS-006","Engineering","TRK-KZJ-012","KZJ-WL","Km 12/04-10 Warangal Curve","Check Rail Clearance Adjustment","Check rail gap reduction due to high tonnage freight wear.","Medium","Medium","2026-09-03",0,1.5,"P-Way Curve Gang 01","Pending",0,1),
        ("TMS-007","Engineering","TRK-BZA-015","BZA-GNT","Krishna Canal Bridge Approach #4","Bridge Expansion Joint Inspection","Bearing plate elastomeric pad replacement on pier girder #4.","High","High","2026-08-30",1,2.5,"P-Way Bridge Unit South","Pending",0,1),
        ("TDMS-006","Traction","OHE-GNT-020","BZA-GNT","Mangalagiri - Guntur Track 2","Return Current Bond & Earthing Test","Structure bond continuity check and mast impedance measurement.","Low","Medium","2026-09-07",0,1.5,"TRD Inspection Team C","Pending",0,0),
        ("SMMS-006","Signal & Telecom","SIG-GNT-028","BZA-GNT","Guntur Yard Point 42A/B","Point Detection Circuit Rewiring","Insulation degradation on underground signaling cable 12-core.","High","High","2026-08-29",2,2.0,"S&T Cable Gang 01","Overdue",0,1),
        ("TMS-008","Engineering","TRK-GNT-030","BZA-GNT","Guntur Platform Line 3","Turnout Wooden Sleeper Swap","Replace cracked wooden turnout sleepers with standard PSC sleepers.","Medium","Low","2026-09-05",0,2.0,"P-Way Yard Gang GNT","Pending",0,1),
        ("TMS-009","Engineering","TRK-WL-165","WL-BZA","Km 165/08-16 Mahbubabad","Flash Butt Weld Testing","Routine USFD scanning of newly laid long welded rail panels.","Low","Medium","2026-09-10",0,1.5,"P-Way USFD Team 03","Pending",0,0),
        ("TDMS-007","Traction","OHE-WL-170","WL-BZA","Kesamudram Neutral Section","Contact Wire Thickness Scan","Micrometer scanning of high wear points near cross-over spans.","Low","Medium","2026-09-12",0,1.0,"TRD Testing Unit 1","Pending",0,0),
        ("SMMS-007","Signal & Telecom","SIG-SEC-075","SEC-KZJ","Alair Automatic Block Section 75","Automatic Signal Aspect Lamp Swap","Preventive LED signal module replacement before MTBF threshold.","Low","Medium","2026-09-11",0,1.0,"S&T Signal Maintenance 01","Pending",0,0),
        ("TMS-010","Engineering","TRK-SEC-030","SEC-KZJ","Km 30/02-12 Charlapalli Outer","SEJ Packing & Oil Greasing","Seasonal adjustment of gap opening on Long Welded Rails.","Medium","High","2026-08-31",0,1.5,"P-Way Section Gang 02","Pending",0,1),
        ("TDMS-008","Traction","OHE-KZJ-009","KZJ-WL","Kazipet Electric Loco Shed Lead","Auto Tensioning Device Calibration","Counterweight 3-pulley system balance check against temp chart.","Medium","High","2026-09-01",0,1.5,"TRD Yard Gang KZJ","Pending",1,1),
        ("SMMS-008","Signal & Telecom","SIG-WL-120","WL-BZA","Garla Station Electronic Interlocking","Dual Power Supply Inverter Check","Battery bank internal resistance check and solar panel regulator.","Medium","Medium","2026-09-04",0,1.0,"S&T Power Unit 01","Pending",0,0),
        ("TMS-011","Engineering","TRK-SEC-012","SEC-KZJ","Km 12/00-14 Lallaguda Yard","Rail End Batter Grinding","Fishplated joint rail head battered beyond 3.5mm; profile grind.","Low","Medium","2026-09-14",0,2.0,"P-Way Section Gang 01","Pending",0,1),
        ("TDMS-009","Traction","OHE-BZA-040","BZA-GNT","Namburu Sub-section 40","Insulator Jet Washing","Coastal dust contamination wash under power shutdown.","Low","Low","2026-09-15",0,1.0,"TRD Maintenance Gang B","Pending",1,0),
        ("SMMS-009","Signal & Telecom","SIG-KZJ-080","KZJ-WL","Warangal Inward Block Signal 80","Track Lead Cable Impedance Test","Verify high-frequency audio track circuit matching unit.","Low","Low","2026-09-16",0,1.0,"S&T Signal Maintenance 02","Pending",0,0)
    ]
    for t in tasks:
        c.execute("""INSERT INTO maintenance_tasks (
            task_id, department, asset_id, section, location, task_type,
            description, severity, asset_criticality, due_date, overdue_days,
            estimated_duration_hours, required_team, status, requires_power_block,
            requires_traffic_block, priority_score, priority_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 'Medium')""", t)

    # 4. Trains
    trains = [
        ("TRN-01","20601","Vande Bharat Express","Express","Secunderabad","Vijayawada","SEC-KZJ","06:00","07:15","2026-08-30",1,"Critical","Down","Scheduled","On Time","Protected Express Movement"),
        ("TRN-02","20601","Vande Bharat Express","Express","Secunderabad","Vijayawada","KZJ-WL","07:20","07:35","2026-08-30",1,"Critical","Down","Scheduled","On Time","Protected Express Movement"),
        ("TRN-03","20601","Vande Bharat Express","Express","Secunderabad","Vijayawada","WL-BZA","07:40","09:40","2026-08-30",1,"Critical","Down","Scheduled","On Time","Protected Express Movement"),
        ("TRN-04","12437","Secunderabad Rajdhani Exp","Express","Secunderabad","Hazrat Nizamuddin","SEC-KZJ","08:15","09:30","2026-08-30",1,"Critical","Up","Scheduled","On Time","Protected Rajdhani Path"),
        ("TRN-05","12437","Secunderabad Rajdhani Exp","Express","Secunderabad","Hazrat Nizamuddin","KZJ-WL","09:35","09:50","2026-08-30",1,"Critical","Up","Scheduled","On Time","Protected Rajdhani Path"),
        ("TRN-06","12437","Secunderabad Rajdhani Exp","Express","Secunderabad","Hazrat Nizamuddin","WL-BZA","09:55","12:05","2026-08-30",1,"Critical","Up","Scheduled","On Time","Protected Rajdhani Path"),
        ("TRN-07","20602","Vande Bharat Express (Up)","Express","Vijayawada","Secunderabad","WL-BZA","16:30","18:30","2026-08-30",1,"Critical","Up","Scheduled","On Time","Protected Express Path"),
        ("TRN-08","20602","Vande Bharat Express (Up)","Express","Vijayawada","Secunderabad","SEC-KZJ","18:50","20:05","2026-08-30",1,"Critical","Up","Scheduled","On Time","Protected Express Path"),
        ("TRN-09","12727","Godavari Superfast Exp","Superfast","Visakhapatnam","Hyderabad","SEC-KZJ","17:15","18:40","2026-08-30",2,"High","Up","Scheduled","On Time","Trunk Passenger Express"),
        ("TRN-10","12727","Godavari Superfast Exp","Superfast","Visakhapatnam","Hyderabad","KZJ-WL","18:45","19:00","2026-08-30",2,"High","Up","Scheduled","On Time","Trunk Passenger Express"),
        ("TRN-11","12727","Godavari Superfast Exp","Superfast","Visakhapatnam","Hyderabad","WL-BZA","19:05","21:30","2026-08-30",2,"High","Up","Scheduled","On Time","Trunk Passenger Express"),
        ("TRN-12","12759","Charminar Express","Superfast","Chennai Central","Hyderabad","SEC-KZJ","18:00","19:25","2026-08-30",2,"High","Up","Scheduled","On Time","Grand Trunk Superfast"),
        ("TRN-13","12759","Charminar Express","Superfast","Chennai Central","Hyderabad","WL-BZA","19:50","22:15","2026-08-30",2,"High","Up","Scheduled","Delayed (+15m)","Grand Trunk Superfast"),
        ("TRN-14","12713","Satavahana Intercity Exp","Express","Vijayawada","Secunderabad","SEC-KZJ","06:30","07:55","2026-08-30",2,"High","Up","Scheduled","On Time","Intercity Daily"),
        ("TRN-15","12713","Satavahana Intercity Exp","Express","Vijayawada","Secunderabad","WL-BZA","08:20","10:35","2026-08-30",2,"High","Up","Scheduled","On Time","Intercity Daily"),
        ("TRN-16","17201","Golconda Express","Express","Guntur","Secunderabad","SEC-KZJ","13:00","14:45","2026-08-30",2,"High","Up","Scheduled","On Time","Day Express"),
        ("TRN-17","17201","Golconda Express","Express","Guntur","Secunderabad","BZA-GNT","20:45","21:30","2026-08-30",2,"High","Up","Scheduled","On Time","Day Express"),
        ("TRN-18","07757","Secunderabad - Warangal MEMU","MEMU","Secunderabad","Warangal","SEC-KZJ","09:00","11:15","2026-08-30",3,"Medium","Down","Scheduled","On Time","Local Passenger"),
        ("TRN-19","07757","Secunderabad - Warangal MEMU","MEMU","Secunderabad","Warangal","KZJ-WL","11:20","11:45","2026-08-30",3,"Medium","Down","Scheduled","On Time","Local Passenger"),
        ("TRN-20","07765","Kazipet - Vijayawada Passenger","Passenger","Kazipet","Vijayawada","WL-BZA","10:30","13:15","2026-08-30",3,"Medium","Down","Scheduled","On Time","Passenger Rake"),
        ("TRN-21","07255","Vijayawada - Guntur Local","Passenger","Vijayawada","Guntur","BZA-GNT","08:15","09:10","2026-08-30",3,"Medium","Down","Scheduled","On Time","Commuter Shuttle"),
        ("TRN-22","07256","Guntur - Vijayawada Local","Passenger","Guntur","Vijayawada","BZA-GNT","15:20","16:15","2026-08-30",3,"Medium","Up","Scheduled","On Time","Commuter Shuttle"),
        ("TRN-23","07780","Dornakal - Vijayawada Passenger","Passenger","Dornakal","Vijayawada","WL-BZA","15:45","17:30","2026-08-30",3,"Medium","Down","Scheduled","On Time","Passenger Rake"),
        ("TRN-24","G-BCN-01","Coal Rake BCN/E #4102","Goods","Singareni Colliery","Dr NTTPS Kondapalli","SEC-KZJ","02:00","04:30","2026-08-30",4,"Low","Down","Scheduled","On Time","Bulk Thermal Coal"),
        ("TRN-25","G-BOXN-02","Iron Ore BOXN #8819","Goods","Bellary","Visakhapatnam Steel","WL-BZA","01:30","04:45","2026-08-30",4,"Low","Down","Scheduled","On Time","Iron Ore Freight"),
        ("TRN-26","G-CON-03","CONCOR Container Rake #12","Goods","Sanathnagar ICD","Chennai Port","SEC-KZJ","11:45","13:30","2026-08-30",4,"Low","Down","Scheduled","On Time","Container Logistics"),
        ("TRN-27","G-BTPN-04","Petroleum Tanker BTPN #04","Goods","Malkapuram POL","Kazipet Siding","KZJ-WL","14:15","15:00","2026-08-30",4,"Low","Up","Scheduled","On Time","POL Tanker Rake"),
        ("TRN-28","G-NMG-05","Automobile Rake NMG #33","Goods","Walajapet","Nagpur","BZA-GNT","12:00","13:15","2026-08-30",4,"Low","Up","Scheduled","On Time","Auto Carrier Rake"),
        ("TRN-29","G-BCN-06","Foodgrain Rake BCN #91","Goods","FCI Cherlapalli","Kakinada Port","WL-BZA","13:45","15:45","2026-08-30",4,"Low","Down","Scheduled","On Time","FCI Foodgrains"),
        ("TRN-30","SPL-MIL-01","Military Special Rake #07","Special","Secunderabad Cantt","Visakhapatnam","SEC-KZJ","22:00","23:45","2026-08-30",2,"High","Down","Scheduled","On Time","Special Military Move")
    ]
    for tr in trains:
        c.execute("""INSERT INTO trains VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", tr)

    # 5. Goods Forecasts
    forecasts = [
        ("GF-01","SEC-KZJ","01:00","05:00",0.85,"High"),
        ("GF-02","SEC-KZJ","11:00","14:00",0.40,"Medium"),
        ("GF-03","SEC-KZJ","15:00","18:00",0.70,"High"),
        ("GF-04","KZJ-WL","02:00","06:00",0.90,"High"),
        ("GF-05","KZJ-WL","13:30","16:00",0.65,"High"),
        ("GF-06","WL-BZA","00:30","05:00",0.88,"High"),
        ("GF-07","WL-BZA","13:00","15:30",0.25,"Low"),
        ("GF-08","WL-BZA","16:00","19:30",0.80,"High"),
        ("GF-09","BZA-GNT","03:00","06:00",0.75,"High"),
        ("GF-10","BZA-GNT","11:30","14:00",0.35,"Low"),
        ("GF-11","BZA-GNT","16:30","19:00",0.60,"Medium"),
        ("GF-12","SEC-KZJ","21:00","23:59",0.65,"Medium")
    ]
    for gf in forecasts:
        c.execute("INSERT INTO goods_forecasts VALUES (?, ?, ?, ?, ?, ?)", gf)

    # 6. Block Availability
    blocks = [
        ("BLK-01","WL-BZA","2026-08-30","13:00","15:00",2.0,"Available"),
        ("BLK-02","SEC-KZJ","2026-08-30","11:30","14:00",2.5,"Available"),
        ("BLK-03","KZJ-WL","2026-08-30","12:00","14:00",2.0,"Available"),
        ("BLK-04","BZA-GNT","2026-08-30","13:00","15:30",2.5,"Available"),
        ("BLK-05","WL-BZA","2026-08-30","02:00","05:00",3.0,"Available"),
        ("BLK-06","SEC-KZJ","2026-08-30","01:30","04:30",3.0,"Available"),
        ("BLK-07","WL-BZA","2026-08-31","13:00","16:00",3.0,"Available"),
        ("BLK-08","SEC-KZJ","2026-08-31","11:00","15:00",4.0,"Available"),
        ("BLK-09","KZJ-WL","2026-09-01","12:30","14:30",2.0,"Available"),
        ("BLK-10","BZA-GNT","2026-09-01","13:30","15:30",2.0,"Available"),
        ("BLK-11","WL-BZA","2026-09-02","10:30","14:00",3.5,"Available"),
        ("BLK-12","SEC-KZJ","2026-09-02","13:00","15:30",2.5,"Available"),
        ("BLK-13","KZJ-WL","2026-09-03","11:00","13:00",2.0,"Available"),
        ("BLK-14","WL-BZA","2026-09-04","12:00","15:00",3.0,"Available"),
        ("BLK-15","SEC-KZJ","2026-09-05","10:00","14:30",4.5,"Available"),
        ("BLK-16","BZA-GNT","2026-09-05","14:00","16:30",2.5,"Available")
    ]
    for blk in blocks:
        c.execute("INSERT INTO block_availability VALUES (?, ?, ?, ?, ?, ?, ?)", blk)

    conn.commit()
    conn.close()
    print(f"Database seeded: {len(stations)} stations, {len(sections)} sections, {len(tasks)} tasks, {len(trains)} trains, {len(blocks)} blocks.")

if __name__ == "__main__":
    seed_database()
