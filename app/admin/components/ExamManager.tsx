"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase client (uses your existing env vars) ────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ────────────────────────────────────────────────────────────────────
interface AccomCode {
  code: string;
  multiplier: number;
  label: string;
}

interface Exam {
  id: string;
  name: string;
  is_live: boolean;
  pdf_url: string | null;
  answer_key_url: string | null;
  created_at: string;
  deadline: string | null;
  accommodation_codes: AccomCode[];
  section_count: number;
  questions_per_section: number;
  time_per_section_minutes: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const DEFAULT_ACCOM_CODES: AccomCode[] = [
  { code: "EXT15X", multiplier: 1.5, label: "1.5× Extended Time" },
  { code: "EXT2X", multiplier: 2.0, label: "2.0× Extended Time" },
];

function Badge({ live }: { live: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.04em",
        background: live ? "#e6f4ea" : "#fdf3e7",
        color: live ? "#1e7e34" : "#a0600a",
        border: `1px solid ${live ? "#a8d5b5" : "#f0c87a"}`,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: live ? "#28a745" : "#c9a84c",
          display: "inline-block",
        }}
      />
      {live ? "Live" : "Hidden"}
    </span>
  );
}

function UploadZone({
  label,
  accept,
  file,
  progress,
  onFile,
  disabled,
}: {
  label: string;
  accept: string;
  file: File | null;
  progress: number | null;
  onFile: (f: File) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  return (
    <div
      onClick={() => !disabled && ref.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? "#c9a84c" : "#c8bfa8"}`,
        borderRadius: 10,
        padding: "18px 16px",
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        background: dragging ? "#fdf8ee" : "#faf8f4",
        transition: "all 0.18s",
        opacity: disabled ? 0.5 : 1,
        position: "relative",
      }}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        disabled={disabled}
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />

      {progress !== null ? (
        <div>
          <div style={{ fontSize: 13, color: "#0d2340", marginBottom: 8 }}>
            Uploading… {progress}%
          </div>
          <div
            style={{
              height: 6,
              background: "#e5dfd4",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "#c9a84c",
                borderRadius: 4,
                transition: "width 0.2s",
              }}
            />
          </div>
        </div>
      ) : file ? (
        <div style={{ fontSize: 13, color: "#1e7e34", fontWeight: 600 }}>
          ✓ {file.name}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 22, marginBottom: 4 }}>
            {accept.includes("pdf") ? "📄" : "📋"}
          </div>
          <div style={{ fontSize: 13, color: "#0d2340", fontWeight: 600 }}>
            {label}
          </div>
          <div style={{ fontSize: 11, color: "#7a6f5e", marginTop: 3 }}>
            drag & drop or click to browse
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ExamManager() {
  // ── State ──
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // new exam form
  const [newTitle, setNewTitle] = useState("");
  const [newSections, setNewSections] = useState(4);
  const [newQps, setNewQps] = useState(50);
  const [newMinutes, setNewMinutes] = useState(72);

  // uploads
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);
  const [keyProgress, setKeyProgress] = useState<number | null>(null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // accommodation codes panel
  const [accomCodes, setAccomCodes] = useState<AccomCode[]>([
    ...DEFAULT_ACCOM_CODES,
  ]);
  const [newCode, setNewCode] = useState("");
  const [newMult, setNewMult] = useState("1.5");
  const [newCodeLabel, setNewCodeLabel] = useState("");
  const [accomMsg, setAccomMsg] = useState<string | null>(null);

  // edit settings
  const [editTitle, setEditTitle] = useState("");
  const [editMinutes, setEditMinutes] = useState(72);
  const [editDeadline, setEditDeadline] = useState("");
  const [editMsg, setEditMsg] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // toggle saving state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Fetch exams ──
  const fetchExams = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);
    if (error) {
      setLoadError(error.message);
      return;
    }
    setExams(
      (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        name: row.name as string,
        is_live: (row.is_live as boolean) ?? false,
        pdf_url: (row.pdf_url as string | null) ?? null,
        answer_key_url: (row.answer_key_url as string | null) ?? null,
        created_at: row.created_at as string,
        deadline: (row.deadline as string | null) ?? null,
        accommodation_codes:
          (row.accommodation_codes as AccomCode[]) ?? DEFAULT_ACCOM_CODES,
        section_count: (row.section_count as number) ?? 4,
        questions_per_section: (row.questions_per_section as number) ?? 50,
        time_per_section_minutes:
          (row.time_per_section_minutes as number) ?? 72,
      }))
    );
    setFetched(true);
  }, []);

  // Load on first render
  if (!fetched && !loading) fetchExams();

  // ── Load selected exam data into local state ──
  const selectExam = (exam: Exam) => {
    setSelectedId(exam.id);
    setCreating(false);
    setAccomCodes(
      exam.accommodation_codes?.length
        ? exam.accommodation_codes
        : [...DEFAULT_ACCOM_CODES]
    );
    setEditTitle(exam.name);
    setEditMinutes(exam.time_per_section_minutes);
    setEditDeadline(exam.deadline ? exam.deadline.slice(0, 16) : "");
    setEditMsg(null);
    setPdfFile(null);
    setKeyFile(null);
    setPdfProgress(null);
    setKeyProgress(null);
    setUploadMsg(null);
    setAccomMsg(null);
  };

  const selectedExam = exams.find((e) => e.id === selectedId) ?? null;

  // ── Create new exam ──
  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("exams")
      .insert({
        name: newTitle.trim(),
        is_live: false,
        section_count: newSections,
        questions_per_section: newQps,
        time_per_section_minutes: newMinutes,
        accommodation_codes: DEFAULT_ACCOM_CODES,
      })
      .select()
      .single();

    setLoading(false);
    if (error) {
      alert("Error creating exam: " + error.message);
      return;
    }
    setNewTitle("");
    setCreating(false);
    await fetchExams();
    if (data) selectExam(data as Exam);
  };

  // ── Toggle live/hidden ──
  const handleToggle = async (exam: Exam) => {
    setTogglingId(exam.id);
    const { error } = await supabase
      .from("exams")
      .update({ is_live: !exam.is_live })
      .eq("id", exam.id);
    setTogglingId(null);
    if (error) {
      alert("Toggle failed: " + error.message);
      return;
    }
    setExams((prev) =>
      prev.map((e) => (e.id === exam.id ? { ...e, is_live: !e.is_live } : e))
    );
  };

  // ── Save exam settings (title, minutes, deadline) ──
  const handleSaveSettings = async () => {
    if (!selectedExam) return;
    setEditSaving(true);
    setEditMsg(null);
    const totalMins = editMinutes * selectedExam.section_count;
    const hrs = totalMins / 60;
    const timeLimitText = Number.isInteger(hrs) ? `${hrs} hrs` : `${+hrs.toFixed(1)} hrs`;
    const { error } = await supabase.from("exams").update({
      name: editTitle.trim() || selectedExam.name,
      time_per_section_minutes: editMinutes,
      time_limit: timeLimitText,
      deadline: editDeadline ? new Date(editDeadline).toISOString() : null,
    }).eq("id", selectedExam.id);
    setEditSaving(false);
    if (error) { setEditMsg("❌ " + error.message); return; }
    setExams(prev => prev.map(e => e.id === selectedExam.id
      ? { ...e, name: editTitle.trim() || e.name, time_per_section_minutes: editMinutes, deadline: editDeadline ? new Date(editDeadline).toISOString() : null }
      : e));
    setEditMsg("✓ Settings saved.");
  };

  // ── Delete exam ──
  const handleDelete = async () => {
    if (!selectedExam) return;
    if (!window.confirm(`Delete "${selectedExam.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const { error } = await supabase.from("exams").delete().eq("id", selectedExam.id);
    setDeleting(false);
    if (error) { alert("Delete failed: " + error.message); return; }
    setExams(prev => prev.filter(e => e.id !== selectedExam.id));
    setSelectedId(null);
  };

  // ── Simulate chunked upload progress (real XHR upload for Supabase Storage) ──
  const uploadFile = async (
    bucket: string,
    path: string,
    file: File,
    onProgress: (n: number) => void
  ): Promise<string | null> => {
    // Supabase JS v2 doesn't expose upload progress natively,
    // so we simulate with a fake ticker while the upload runs.
    let tick = 0;
    const interval = setInterval(() => {
      tick = Math.min(tick + Math.random() * 15, 88);
      onProgress(Math.round(tick));
    }, 200);

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    clearInterval(interval);

    if (error) {
      onProgress(0);
      return null;
    }

    onProgress(100);
    return path;
  };

  // ── Handle PDF + answer key uploads ──
  const handleUpload = async () => {
    if (!selectedExam) return;
    setUploadMsg(null);

    let pdfUrl = selectedExam.pdf_url;
    let keyUrl = selectedExam.answer_key_url;

    if (pdfFile) {
      setPdfProgress(0);
      const url = await uploadFile(
        "exam-pdfs",
        `${selectedExam.id}/exam.pdf`,
        pdfFile,
        setPdfProgress
      );
      if (!url) {
        setUploadMsg("❌ PDF upload failed.");
        return;
      }
      pdfUrl = url;
    }

    if (keyFile) {
      setKeyProgress(0);
      const url = await uploadFile(
        "exam-keys",
        `${selectedExam.id}/answer_key.json`,
        keyFile,
        setKeyProgress
      );
      if (!url) {
        setUploadMsg("❌ Answer key upload failed.");
        return;
      }
      keyUrl = url;
    }

    if (pdfFile || keyFile) {
      const { error } = await supabase
        .from("exams")
        .update({ pdf_url: pdfUrl, answer_key_url: keyUrl })
        .eq("id", selectedExam.id);

      if (error) {
        setUploadMsg("❌ DB update failed: " + error.message);
        return;
      }

      setExams((prev) =>
        prev.map((e) =>
          e.id === selectedExam.id
            ? { ...e, pdf_url: pdfUrl, answer_key_url: keyUrl }
            : e
        )
      );
      setUploadMsg("✓ Files saved successfully.");
      setPdfFile(null);
      setKeyFile(null);
    }
  };

  // ── Save accommodation codes ──
  const handleSaveAccom = async () => {
    if (!selectedExam) return;
    setAccomMsg(null);
    const { error } = await supabase
      .from("exams")
      .update({ accommodation_codes: accomCodes })
      .eq("id", selectedExam.id);

    if (error) {
      setAccomMsg("❌ " + error.message);
      return;
    }
    setExams((prev) =>
      prev.map((e) =>
        e.id === selectedExam.id ? { ...e, accommodation_codes: accomCodes } : e
      )
    );
    setAccomMsg("✓ Passcodes saved.");
  };

  const addCode = () => {
    const code = newCode.trim().toUpperCase();
    const mult = parseFloat(newMult);
    if (!code || isNaN(mult) || mult <= 1) return;
    if (accomCodes.find((c) => c.code === code)) return;
    setAccomCodes((prev) => [
      ...prev,
      { code, multiplier: mult, label: newCodeLabel || `${mult}× Extended Time` },
    ]);
    setNewCode("");
    setNewMult("1.5");
    setNewCodeLabel("");
  };

  const removeCode = (code: string) => {
    setAccomCodes((prev) => prev.filter((c) => c.code !== code));
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const S = {
    wrap: {
      fontFamily: "'Sora', sans-serif",
      display: "grid" as const,
      gridTemplateColumns: "260px 1fr",
      gap: 0,
      height: "calc(100vh - 60px)",
      background: "#f7f4ee",
    },
    sidebar: {
      background: "#0d2340",
      display: "flex" as const,
      flexDirection: "column" as const,
      overflow: "hidden",
    },
    sidebarHeader: {
      padding: "20px 16px 14px",
      borderBottom: "1px solid rgba(201,168,76,0.25)",
    },
    sidebarTitle: {
      color: "#c9a84c",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      marginBottom: 12,
    },
    newBtn: {
      width: "100%",
      padding: "9px 14px",
      background: "#c9a84c",
      color: "#0d2340",
      border: "none",
      borderRadius: 8,
      fontFamily: "'Sora', sans-serif",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      letterSpacing: "0.02em",
    },
    examList: {
      flex: 1,
      overflowY: "auto" as const,
      padding: "8px 0",
    },
    examItem: (active: boolean) => ({
      padding: "11px 16px",
      cursor: "pointer",
      background: active ? "rgba(201,168,76,0.15)" : "transparent",
      borderLeft: `3px solid ${active ? "#c9a84c" : "transparent"}`,
      transition: "all 0.15s",
    }),
    examItemTitle: (active: boolean) => ({
      color: active ? "#fff" : "#b0bec5",
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      marginBottom: 4,
      whiteSpace: "nowrap" as const,
      overflow: "hidden",
      textOverflow: "ellipsis",
    }),
    main: {
      overflowY: "auto" as const,
      padding: "28px 32px",
    },
    pageTitle: {
      fontSize: 22,
      fontWeight: 700,
      color: "#0d2340",
      marginBottom: 4,
    },
    pageSubtitle: {
      fontSize: 13,
      color: "#7a6f5e",
      marginBottom: 28,
    },
    card: {
      background: "#fff",
      borderRadius: 12,
      padding: "22px 24px",
      marginBottom: 20,
      boxShadow: "0 1px 4px rgba(13,35,64,0.07)",
      border: "1px solid #e8e2d6",
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: 700,
      color: "#0d2340",
      letterSpacing: "0.05em",
      textTransform: "uppercase" as const,
      marginBottom: 16,
      display: "flex" as const,
      alignItems: "center",
      gap: 8,
    },
    label: {
      display: "block",
      fontSize: 12,
      fontWeight: 600,
      color: "#4a4035",
      marginBottom: 5,
      letterSpacing: "0.03em",
    },
    input: {
      width: "100%",
      padding: "9px 12px",
      border: "1.5px solid #d6cfc2",
      borderRadius: 7,
      fontFamily: "'Sora', sans-serif",
      fontSize: 13,
      color: "#0d2340",
      background: "#faf8f4",
      boxSizing: "border-box" as const,
      outline: "none",
    },
    row: {
      display: "grid" as const,
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
    },
    row3: {
      display: "grid" as const,
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 16,
    },
    btn: {
      padding: "9px 20px",
      background: "#0d2340",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      fontFamily: "'Sora', sans-serif",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      letterSpacing: "0.02em",
    },
    btnGold: {
      padding: "9px 20px",
      background: "#c9a84c",
      color: "#0d2340",
      border: "none",
      borderRadius: 8,
      fontFamily: "'Sora', sans-serif",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      letterSpacing: "0.02em",
    },
    btnSm: {
      padding: "6px 14px",
      background: "#0d2340",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      fontFamily: "'Sora', sans-serif",
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
    },
    msg: (ok: boolean) => ({
      fontSize: 13,
      fontWeight: 600,
      color: ok ? "#1e7e34" : "#c0392b",
      marginTop: 10,
    }),
    toggleBtn: (live: boolean, toggling: boolean) => ({
      padding: "8px 18px",
      background: live ? "#c0392b" : "#1e7e34",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      fontFamily: "'Sora', sans-serif",
      fontSize: 13,
      fontWeight: 600,
      cursor: toggling ? "wait" : "pointer",
      opacity: toggling ? 0.6 : 1,
      letterSpacing: "0.02em",
      transition: "all 0.2s",
    }),
    pill: {
      display: "inline-flex" as const,
      alignItems: "center",
      gap: 8,
      background: "#f0ece3",
      border: "1px solid #d6cfc2",
      borderRadius: 20,
      padding: "5px 12px",
      fontSize: 12,
      color: "#0d2340",
      fontWeight: 600,
      marginRight: 8,
      marginBottom: 8,
    },
    removePill: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#c0392b",
      fontSize: 15,
      lineHeight: 1,
      padding: 0,
      fontWeight: 700,
    },
    emptyState: {
      textAlign: "center" as const,
      padding: "60px 20px",
      color: "#7a6f5e",
    },
    statBox: {
      background: "#f7f4ee",
      border: "1px solid #e8e2d6",
      borderRadius: 8,
      padding: "14px 16px",
      textAlign: "center" as const,
    },
    statNum: {
      fontSize: 24,
      fontWeight: 700,
      color: "#0d2340",
    },
    statLabel: {
      fontSize: 11,
      color: "#7a6f5e",
      fontWeight: 600,
      letterSpacing: "0.05em",
      textTransform: "uppercase" as const,
      marginTop: 2,
    },
  };

  // ── Render: new exam form (sidebar) ──
  const renderNewForm = () => (
    <div style={S.card}>
      <div style={S.cardTitle}>📝 New Exam</div>
      <div style={{ marginBottom: 14 }}>
        <label style={S.label}>Exam Title</label>
        <input
          style={S.input}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="e.g. Step 1 Practice Exam 1"
        />
      </div>
      <div style={{ ...S.row3, marginBottom: 14 }}>
        <div>
          <label style={S.label}>Sections</label>
          <input
            style={S.input}
            type="number"
            min={1}
            max={8}
            value={newSections}
            onChange={(e) => setNewSections(Number(e.target.value))}
          />
        </div>
        <div>
          <label style={S.label}>Qs / section</label>
          <input
            style={S.input}
            type="number"
            min={1}
            value={newQps}
            onChange={(e) => setNewQps(Number(e.target.value))}
          />
        </div>
        <div>
          <label style={S.label}>Min / section</label>
          <input
            style={S.input}
            type="number"
            min={1}
            value={newMinutes}
            onChange={(e) => setNewMinutes(Number(e.target.value))}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={S.btnGold} onClick={handleCreate} disabled={!newTitle.trim()}>
          Create Exam
        </button>
        <button
          style={{ ...S.btn, background: "#7a6f5e" }}
          onClick={() => setCreating(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // ── Render: exam detail panel ──
  const renderDetail = () => {
    if (!selectedExam) return null;
    const toggling = togglingId === selectedExam.id;

    return (
      <>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ ...S.pageTitle, marginBottom: 6 }}>
              {selectedExam.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Badge live={selectedExam.is_live} />
              <span style={{ fontSize: 12, color: "#7a6f5e" }}>
                Created{" "}
                {new Date(selectedExam.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <button
            style={S.toggleBtn(selectedExam.is_live, toggling)}
            onClick={() => handleToggle(selectedExam)}
            disabled={toggling}
          >
            {toggling
              ? "Saving…"
              : selectedExam.is_live
              ? "⏸ Hide from Students"
              : "▶ Publish to Students"}
          </button>
        </div>

        {/* Stats row */}
        <div style={{ ...S.row3, marginBottom: 20 }}>
          <div style={S.statBox}>
            <div style={S.statNum}>{selectedExam.section_count}</div>
            <div style={S.statLabel}>Sections</div>
          </div>
          <div style={S.statBox}>
            <div style={S.statNum}>
              {selectedExam.section_count * selectedExam.questions_per_section}
            </div>
            <div style={S.statLabel}>Total Questions</div>
          </div>
          <div style={S.statBox}>
            <div style={S.statNum}>
              {selectedExam.time_per_section_minutes}
            </div>
            <div style={S.statLabel}>Min / Section</div>
          </div>
        </div>

        {/* Edit Settings Card */}
        <div style={S.card}>
          <div style={S.cardTitle}><span>⚙️</span> Exam Settings</div>
          <div style={{ ...S.row3, marginBottom: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>Exam Name</label>
              <input style={{ ...S.input, width: '100%' }} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
          </div>
          <div style={{ ...S.row3, marginBottom: 14 }}>
            <div>
              <label style={S.label}>Min / Section</label>
              <input style={S.input} type="number" min={1} value={editMinutes} onChange={e => setEditMinutes(Number(e.target.value))} />
              <div style={{ fontSize: 11, color: '#7a6f5e', marginTop: 4 }}>
                Total: {editMinutes * selectedExam.section_count} min ({Math.round(editMinutes * selectedExam.section_count / 60 * 10) / 10} hrs)
              </div>
            </div>
            <div>
              <label style={S.label}>Deadline (local time)</label>
              <input style={S.input} type="datetime-local" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button style={S.btnGold} onClick={handleSaveSettings} disabled={editSaving}>
              {editSaving ? 'Saving…' : 'Save Settings'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ ...S.btn, background: '#9e2a2a', color: 'white', fontSize: 13 }}>
              {deleting ? 'Deleting…' : '🗑 Delete Exam'}
            </button>
          </div>
          {editMsg && <div style={S.msg(editMsg.startsWith("✓"))}>{editMsg}</div>}
        </div>

        {/* Upload Card */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <span>📂</span> Exam Files
          </div>

          {/* Status row */}
          <div style={{ ...S.row, marginBottom: 18 }}>
            <div
              style={{
                background: selectedExam.pdf_url ? "#e6f4ea" : "#fff8ee",
                border: `1px solid ${selectedExam.pdf_url ? "#a8d5b5" : "#f0c87a"}`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 12,
                color: selectedExam.pdf_url ? "#1e7e34" : "#a0600a",
                fontWeight: 600,
              }}
            >
              {selectedExam.pdf_url ? "✓ PDF uploaded" : "⚠ No PDF yet"}
            </div>
            <div
              style={{
                background: selectedExam.answer_key_url ? "#e6f4ea" : "#fff8ee",
                border: `1px solid ${
                  selectedExam.answer_key_url ? "#a8d5b5" : "#f0c87a"
                }`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 12,
                color: selectedExam.answer_key_url ? "#1e7e34" : "#a0600a",
                fontWeight: 600,
              }}
            >
              {selectedExam.answer_key_url
                ? "✓ Answer key uploaded"
                : "⚠ No answer key (AI will extract)"}
            </div>
          </div>

          <div style={{ ...S.row, marginBottom: 16 }}>
            <div>
              <label style={{ ...S.label, marginBottom: 8 }}>
                Exam PDF{" "}
                <span style={{ color: "#c0392b", fontWeight: 400 }}>
                  (required)
                </span>
              </label>
              <UploadZone
                label="Drop exam PDF here"
                accept=".pdf"
                file={pdfFile}
                progress={pdfProgress}
                onFile={setPdfFile}
              />
            </div>
            <div>
              <label style={{ ...S.label, marginBottom: 8 }}>
                Answer Key / Competency Map{" "}
                <span style={{ color: "#7a6f5e", fontWeight: 400 }}>
                  (optional — overrides AI)
                </span>
              </label>
              <UploadZone
                label="Drop JSON key here"
                accept=".json"
                file={keyFile}
                progress={keyProgress}
                onFile={setKeyFile}
              />
            </div>
          </div>

          <div
            style={{
              background: "#f0ece3",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 12,
              color: "#4a4035",
              marginBottom: 16,
              lineHeight: 1.6,
            }}
          >
            <strong>JSON format:</strong>{" "}
            <code style={{ background: "#e5dfd4", padding: "1px 5px", borderRadius: 3 }}>
              {"{ \"1\": { \"answer\": \"B\", \"topic\": \"Cardiology\", \"subtopic\": \"...\", \"system\": \"Cardiovascular\", \"domain\": \"Pathology\" }, ... }"}
            </code>
          </div>

          <button
            style={S.btnGold}
            onClick={handleUpload}
            disabled={!pdfFile && !keyFile}
          >
            Upload Files
          </button>

          {uploadMsg && (
            <div style={S.msg(uploadMsg.startsWith("✓"))}>{uploadMsg}</div>
          )}
        </div>

        {/* Accommodation Codes Card */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <span>🔑</span> Accommodation Passcodes
          </div>

          <p
            style={{
              fontSize: 12,
              color: "#7a6f5e",
              marginBottom: 16,
              lineHeight: 1.6,
            }}
          >
            Students enter a passcode at the start of the exam to receive
            extended time. The multiplier applies to every section timer.
          </p>

          {/* Existing codes */}
          <div style={{ marginBottom: 16 }}>
            {accomCodes.map((c) => (
              <span key={c.code} style={S.pill}>
                <span
                  style={{
                    background: "#0d2340",
                    color: "#c9a84c",
                    borderRadius: 4,
                    padding: "1px 7px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  {c.code}
                </span>
                {c.label}
                <button
                  style={S.removePill}
                  onClick={() => removeCode(c.code)}
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))}
            {accomCodes.length === 0 && (
              <span style={{ fontSize: 12, color: "#a09080" }}>
                No passcodes set
              </span>
            )}
          </div>

          {/* Add code form */}
          <div
            style={{
              background: "#f7f4ee",
              border: "1px solid #e8e2d6",
              borderRadius: 9,
              padding: "14px 16px",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#4a4035", marginBottom: 10 }}>
              Add New Passcode
            </div>
            <div style={{ ...S.row3, marginBottom: 10 }}>
              <div>
                <label style={S.label}>Code</label>
                <input
                  style={S.input}
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="EXT15X"
                  maxLength={10}
                />
              </div>
              <div>
                <label style={S.label}>Multiplier</label>
                <input
                  style={S.input}
                  type="number"
                  step={0.25}
                  min={1.25}
                  value={newMult}
                  onChange={(e) => setNewMult(e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Label</label>
                <input
                  style={S.input}
                  value={newCodeLabel}
                  onChange={(e) => setNewCodeLabel(e.target.value)}
                  placeholder="1.5× Extended Time"
                />
              </div>
            </div>
            <button style={S.btnSm} onClick={addCode}>
              + Add Code
            </button>
          </div>

          <button style={S.btnGold} onClick={handleSaveAccom}>
            Save Passcodes
          </button>
          {accomMsg && (
            <div style={S.msg(accomMsg.startsWith("✓"))}>{accomMsg}</div>
          )}
        </div>
      </>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.wrap}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.sidebarHeader}>
          <div style={S.sidebarTitle}>Exam Center</div>
          <button style={S.newBtn} onClick={() => { setCreating(true); setSelectedId(null); }}>
            + New Exam
          </button>
        </div>

        {loading && !fetched ? (
          <div style={{ color: "#7a8fa6", fontSize: 12, padding: 16 }}>
            Loading…
          </div>
        ) : loadError ? (
          <div style={{ color: "#f08080", fontSize: 12, padding: 16 }}>
            {loadError}
          </div>
        ) : (
          <div style={S.examList}>
            {exams.length === 0 && (
              <div
                style={{ color: "#7a8fa6", fontSize: 12, padding: "16px" }}
              >
                No exams yet.
              </div>
            )}
            {exams.map((exam) => (
              <div
                key={exam.id}
                style={S.examItem(selectedId === exam.id)}
                onClick={() => selectExam(exam)}
              >
                <div style={S.examItemTitle(selectedId === exam.id)}>
                  {exam.name}
                </div>
                <Badge live={exam.is_live} />
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Main panel */}
      <main style={S.main}>
        {creating ? (
          renderNewForm()
        ) : selectedExam ? (
          renderDetail()
        ) : (
          <div style={S.emptyState}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#0d2340",
                marginBottom: 6,
              }}
            >
              Exam Center — Admin
            </div>
            <div style={{ fontSize: 13, color: "#7a6f5e", marginBottom: 20 }}>
              Select an exam from the sidebar, or create a new one.
            </div>
            <button
              style={S.btnGold}
              onClick={() => setCreating(true)}
            >
              + Create First Exam
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
