"""
Maintenance Tasks Router for Block Planner.
Provides full CRUD, validation, and priority inspection for TMS, TDMS, and SMMS tasks.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from database.session import get_connection
from models.domain import MaintenanceTask
from scoring.priority_engine import calculate_priority, score_all_tasks
import json

router = APIRouter(prefix="/api/tasks", tags=["Maintenance Tasks"])

VALID_DEPTS = ["Engineering", "Traction", "Signal & Telecom"]
VALID_SEVERITIES = ["Critical", "High", "Medium", "Low"]
VALID_CRITICALITIES = ["High", "Medium", "Low"]
VALID_STATUSES = ["Pending", "In-Progress", "Completed", "Deferred"]

def row_to_task(r) -> MaintenanceTask:
    d = dict(r)
    d["requires_power_block"] = bool(d.get("requires_power_block", 0))
    d["requires_traffic_block"] = bool(d.get("requires_traffic_block", 1))
    if d.get("score_reasons"):
        try: 
            d["score_reasons"] = json.loads(d["score_reasons"]) if isinstance(d["score_reasons"], str) else d["score_reasons"]
        except Exception: 
            d["score_reasons"] = []
    if d.get("score_breakdown"):
        try: 
            d["score_breakdown"] = json.loads(d["score_breakdown"]) if isinstance(d["score_breakdown"], str) else d["score_breakdown"]
        except Exception: 
            d["score_breakdown"] = {}
    return MaintenanceTask(**d)

@router.get("", response_model=List[MaintenanceTask])
def get_tasks(
    department: Optional[str] = None,
    severity: Optional[str] = None,
    section: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    conn = get_connection()
    c = conn.cursor()
    query = "SELECT * FROM maintenance_tasks WHERE 1=1"
    params = []
    
    if search:
        query += " AND (task_id LIKE ? OR asset_id LIKE ? OR task_type LIKE ? OR description LIKE ? OR location LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term, term])
    if department and department != "All":
        query += " AND department = ?"
        params.append(department)
    if severity and severity != "All":
        query += " AND severity = ?"
        params.append(severity)
    if section and section != "All":
        query += " AND section = ?"
        params.append(section)
    if status and status != "All":
        query += " AND status = ?"
        params.append(status)
        
    query += " ORDER BY overdue_days DESC"
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    
    raw_tasks = [row_to_task(r) for r in rows]
    return score_all_tasks(raw_tasks)

@router.get("/{task_id}", response_model=MaintenanceTask)
def get_task_by_id(task_id: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM maintenance_tasks WHERE task_id = ?", (task_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail=f"Task with ID '{task_id}' not found.")
    task = row_to_task(row)
    score, level, reasons, breakdown = calculate_priority(task)
    task.priority_score = score
    task.priority_level = level
    task.score_reasons = reasons
    task.score_breakdown = breakdown
    return task

@router.post("", response_model=MaintenanceTask)
def create_task(task: MaintenanceTask):
    dept = task.department.strip() if task.department else ""
    asset = task.asset_id.strip() if task.asset_id else ""
    sec = task.section.strip().upper() if task.section else ""
    ttype = task.task_type.strip() if task.task_type else ""

    if not dept or dept not in VALID_DEPTS:
        raise HTTPException(status_code=400, detail=f"Department must be one of {VALID_DEPTS}.")
    if not asset:
        raise HTTPException(status_code=400, detail="Asset ID is required.")
    if not sec:
        raise HTTPException(status_code=400, detail="Railway Section is required.")
    if not ttype:
        raise HTTPException(status_code=400, detail="Task Type is required.")
    if task.estimated_duration_hours <= 0.0 or task.estimated_duration_hours > 24.0:
        raise HTTPException(status_code=400, detail="Estimated Duration must be greater than 0 hours and <= 24 hours.")
    if task.overdue_days < 0:
        raise HTTPException(status_code=400, detail="Overdue days cannot be negative.")
    if task.severity not in VALID_SEVERITIES:
        task.severity = "Medium"
    if task.asset_criticality not in VALID_CRITICALITIES:
        task.asset_criticality = "Medium"

    # Auto-assign ID if missing
    if not task.task_id or task.task_id.strip() == "":
        dept_prefix = "TMS" if dept == "Engineering" else ("TDMS" if dept == "Traction" else "SMMS")
        task.task_id = f"{dept_prefix}-{asset}"
    else:
        task.task_id = task.task_id.strip()

    task.department = dept
    task.asset_id = asset
    task.section = sec
    task.task_type = ttype

    # Calculate Priority
    score, level, reasons, breakdown = calculate_priority(task)
    task.priority_score = score
    task.priority_level = level
    task.score_reasons = reasons
    task.score_breakdown = breakdown

    conn = get_connection()
    c = conn.cursor()
    
    # Check duplicate task_id
    c.execute("SELECT task_id FROM maintenance_tasks WHERE task_id = ?", (task.task_id,))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"Task with ID '{task.task_id}' already exists.")

    try:
        c.execute("""
        INSERT INTO maintenance_tasks (
            task_id, department, asset_id, section, location, task_type,
            description, severity, asset_criticality, due_date, overdue_days,
            estimated_duration_hours, required_team, status, requires_power_block,
            requires_traffic_block, priority_score, priority_level, score_reasons, score_breakdown
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            task.task_id, task.department, task.asset_id, task.section,
            task.location or "", task.task_type, task.description or "", task.severity,
            task.asset_criticality, task.due_date or "2026-08-30", task.overdue_days,
            task.estimated_duration_hours, task.required_team or "General Gang", task.status or "Pending",
            1 if task.requires_power_block else 0, 1 if task.requires_traffic_block else 0,
            task.priority_score, task.priority_level,
            json.dumps(task.score_reasons or []), json.dumps(task.score_breakdown or {})
        ))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Could not create task: {str(e)}")
    conn.close()
    return task

@router.put("/{task_id}", response_model=MaintenanceTask)
def update_task(task_id: str, task: MaintenanceTask):
    dept = task.department.strip() if task.department else ""
    asset = task.asset_id.strip() if task.asset_id else ""
    sec = task.section.strip().upper() if task.section else ""
    ttype = task.task_type.strip() if task.task_type else ""

    if not dept or dept not in VALID_DEPTS:
        raise HTTPException(status_code=400, detail=f"Department must be one of {VALID_DEPTS}.")
    if not asset or not sec or not ttype:
        raise HTTPException(status_code=400, detail="Asset ID, Section, and Task Type are required.")
    if task.estimated_duration_hours <= 0.0 or task.estimated_duration_hours > 24.0:
        raise HTTPException(status_code=400, detail="Estimated Duration must be greater than 0 hours and <= 24 hours.")

    score, level, reasons, breakdown = calculate_priority(task)
    task.priority_score = score
    task.priority_level = level
    task.score_reasons = reasons
    task.score_breakdown = breakdown

    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT task_id FROM maintenance_tasks WHERE task_id = ?", (task_id,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Task with ID '{task_id}' not found.")

    try:
        c.execute("""
        UPDATE maintenance_tasks SET
            department = ?, asset_id = ?, section = ?, location = ?, task_type = ?,
            description = ?, severity = ?, asset_criticality = ?, due_date = ?,
            overdue_days = ?, estimated_duration_hours = ?, required_team = ?,
            status = ?, requires_power_block = ?, requires_traffic_block = ?,
            priority_score = ?, priority_level = ?, score_reasons = ?, score_breakdown = ?
        WHERE task_id = ?
        """, (
            dept, asset, sec, task.location or "",
            ttype, task.description or "", task.severity or "Medium", task.asset_criticality or "Medium",
            task.due_date or "2026-08-30", task.overdue_days, task.estimated_duration_hours,
            task.required_team or "General Gang", task.status or "Pending",
            1 if task.requires_power_block else 0, 1 if task.requires_traffic_block else 0,
            task.priority_score, task.priority_level,
            json.dumps(task.score_reasons or []), json.dumps(task.score_breakdown or {}),
            task_id
        ))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))
    conn.close()
    return task

@router.delete("/{task_id}")
def delete_task(task_id: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM maintenance_tasks WHERE task_id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"message": f"Task '{task_id}' deleted successfully"}
