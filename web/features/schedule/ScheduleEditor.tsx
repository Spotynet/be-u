"use client";

import {useState} from "react";

const INK = "#12211A";
const MAIN = "#558367";

export interface TimeSlot {
  id?: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface DaySchedule {
  day_of_week: number;
  is_available: boolean;
  time_slots: TimeSlot[];
  breaks?: {start_time: string; end_time: string}[];
}

const DAYS = [
  {value: 0, label: "Lunes"},
  {value: 1, label: "Martes"},
  {value: 2, label: "Miércoles"},
  {value: 3, label: "Jueves"},
  {value: 4, label: "Viernes"},
  {value: 5, label: "Sábado"},
  {value: 6, label: "Domingo"},
];

function normalizeTime(t: string): string {
  if (!t) return "09:00";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function buildInitial(initialSchedule: DaySchedule[] = []): DaySchedule[] {
  return DAYS.map((day) => {
    const existing = initialSchedule.find((s) => s.day_of_week === day.value);
    if (!existing) {
      return {day_of_week: day.value, is_available: false, time_slots: []};
    }
    return {
      day_of_week: day.value,
      is_available: existing.is_available !== false,
      time_slots: (existing.time_slots || []).map((slot) => ({
        ...slot,
        start_time: normalizeTime(slot.start_time),
        end_time: normalizeTime(slot.end_time),
        is_active: slot.is_active !== false,
      })),
      breaks: existing.breaks,
    };
  });
}

interface ScheduleEditorProps {
  initialSchedule?: DaySchedule[];
  onSave: (schedule: DaySchedule[]) => void | Promise<void>;
  saving?: boolean;
}

export function ScheduleEditor({initialSchedule = [], onSave, saving}: ScheduleEditorProps) {
  const [schedule, setSchedule] = useState<DaySchedule[]>(() => buildInitial(initialSchedule));
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (dayIndex: number) => {
    setSchedule((prev) =>
      prev.map((day, idx) =>
        idx === dayIndex ? {...day, is_available: !day.is_available} : day
      )
    );
  };

  const addSlot = (dayIndex: number) => {
    setSchedule((prev) =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? {
              ...day,
              time_slots: [
                ...day.time_slots,
                {start_time: "09:00", end_time: "17:00", is_active: true},
              ],
            }
          : day
      )
    );
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    setSchedule((prev) =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? {...day, time_slots: day.time_slots.filter((_, i) => i !== slotIndex)}
          : day
      )
    );
  };

  const updateSlot = (
    dayIndex: number,
    slotIndex: number,
    field: "start_time" | "end_time",
    value: string
  ) => {
    setSchedule((prev) =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? {
              ...day,
              time_slots: day.time_slots.map((slot, sIdx) =>
                sIdx === slotIndex ? {...slot, [field]: value} : slot
              ),
            }
          : day
      )
    );
  };

  const handleSave = async () => {
    setError(null);
    for (const day of schedule) {
      if (!day.is_available) continue;
      if (day.time_slots.length === 0) {
        setError(`Agrega al menos un horario para ${DAYS[day.day_of_week].label}`);
        return;
      }
      for (const slot of day.time_slots) {
        if (slot.start_time >= slot.end_time) {
          setError(
            `En ${DAYS[day.day_of_week].label}, la hora de inicio debe ser anterior a la de fin`
          );
          return;
        }
      }
    }
    const payload = schedule
      .filter((d) => d.is_available)
      .map((d) => ({
        day_of_week: d.day_of_week,
        is_available: true,
        time_slots: d.time_slots.map((s) => ({
          start_time: normalizeTime(s.start_time),
          end_time: normalizeTime(s.end_time),
          is_active: true,
        })),
        breaks: d.breaks || [],
      }));
    await onSave(payload);
  };

  return (
    <div>
      <p style={{color: "#64748b", margin: "0 0 16px", fontSize: 14}}>
        Selecciona los días disponibles y agrega los horarios.
      </p>
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: 12,
            padding: 12,
            color: "#dc2626",
            marginBottom: 12,
            fontSize: 14,
          }}>
          {error}
        </div>
      )}
      <div style={{display: "flex", flexDirection: "column", gap: 10}}>
        {schedule.map((day, dayIndex) => (
          <div
            key={day.day_of_week}
            style={{
              background: "white",
              border: "1px solid rgba(18,33,26,0.08)",
              borderRadius: 14,
              padding: 14,
            }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                fontWeight: 800,
                color: INK,
              }}>
              <input
                type="checkbox"
                checked={day.is_available}
                onChange={() => toggleDay(dayIndex)}
              />
              {DAYS[day.day_of_week].label}
            </label>
            {day.is_available && (
              <div style={{marginTop: 12, display: "flex", flexDirection: "column", gap: 8}}>
                {day.time_slots.map((slot, slotIndex) => (
                  <div key={slotIndex} className="nabbi-stack-row">
                    <input
                      type="time"
                      value={normalizeTime(slot.start_time)}
                      onChange={(e) =>
                        updateSlot(dayIndex, slotIndex, "start_time", e.target.value)
                      }
                      style={{...timeInputStyle, flex: "1 1 110px"}}
                    />
                    <span style={{color: "#64748b"}}>—</span>
                    <input
                      type="time"
                      value={normalizeTime(slot.end_time)}
                      onChange={(e) =>
                        updateSlot(dayIndex, slotIndex, "end_time", e.target.value)
                      }
                      style={{...timeInputStyle, flex: "1 1 110px"}}
                    />
                    <button
                      type="button"
                      onClick={() => removeSlot(dayIndex, slotIndex)}
                      style={ghostBtn}>
                      Quitar
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addSlot(dayIndex)} style={outlineBtn}>
                  + Agregar horario
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{
          marginTop: 20,
          width: "100%",
          background: MAIN,
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: "14px 16px",
          fontWeight: 800,
          cursor: saving ? "wait" : "pointer",
          opacity: saving ? 0.7 : 1,
        }}>
        {saving ? "Guardando…" : "Guardar horario"}
      </button>
    </div>
  );
}

const timeInputStyle: React.CSSProperties = {
  border: "1px solid rgba(18,33,26,0.15)",
  borderRadius: 10,
  padding: "8px 10px",
  fontSize: 14,
  minWidth: 0,
  width: "auto",
};

const ghostBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#dc2626",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 13,
};

const outlineBtn: React.CSSProperties = {
  background: "rgba(85,131,103,0.1)",
  border: "none",
  color: MAIN,
  fontWeight: 700,
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
  alignSelf: "flex-start",
  fontSize: 13,
};
