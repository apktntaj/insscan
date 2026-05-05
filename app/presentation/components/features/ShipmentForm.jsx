"use client";

/**
 * ShipmentForm Component
 * Presentation Layer — Feature component
 *
 * @description Modal form for creating and editing shipment records.
 * - All text inputs are auto-uppercased for readability and consistency.
 * - Shipment number is auto-generated (not user-editable) from consignee initials + month + year + serial.
 * - Immutable fields (blNumber) are read-only in edit mode.
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { extractConsigneeInitials, generateShipmentNumber } from "../../../core/entities/shipment";

const MONTH_ABBR = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

const EMPTY_FORM = {
  blNumber: "",
  shipperName: "",
  consigneeName: "",
  vesselName: "",
  voyage: "",
  portOfLoading: "",
  portOfDischarge: "",
  eta: "",
  customNotificationDate: "",
  alias: "",
  notes: "",
};

/**
 * Returns a preview of the generated shipment number based on consignee name.
 * Serial is shown as "???" since the real serial is determined at save time.
 */
function previewShipmentNumber(consigneeName) {
  if (!consigneeName || !consigneeName.trim()) return "—";
  const now = new Date();
  const initials = extractConsigneeInitials(consigneeName);
  const month = MONTH_ABBR[now.getMonth()];
  const year = String(now.getFullYear()).slice(-2);
  return `${initials}${month}${year}???`;
}

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSubmit: (data: Object) => Promise<{ok: boolean, error?: Object}>,
 *   initialData?: Object|null,
 *   isEditMode?: boolean,
 *   autoFillData?: Object|null,
 *   isAutoFilled?: boolean,
 *   embedded?: boolean,
 *   onFieldFocus?: (fieldName: string, event: Event) => void,
 *   onFieldBlur?: () => void,
 *   activeField?: string|null,
 *   clipboardBuffer?: string[],
 * }} props
 */
export default function ShipmentForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  isEditMode = false,
  autoFillData = null,
  isAutoFilled = false,
  embedded = false,
  onFieldFocus = null,
  onFieldBlur = null,
  activeField = null,
  clipboardBuffer = []
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const formContainerRef = useRef(null);
  
  // Confidence scores from auto-fill
  const confidenceScores = autoFillData?._confidenceScores || {};
  const extractionMethod = autoFillData?._extractionMethod || null;
  const overallConfidence = useMemo(() => {
    if (!isAutoFilled || Object.keys(confidenceScores).length === 0) return null;
    const scores = Object.values(confidenceScores);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }, [isAutoFilled, confidenceScores]);

  // Generate unique datalist ID for clipboard suggestions
  const datalistId = "clipboard-suggestions";

  useEffect(() => {
    if (isOpen) {
      // Priority: autoFillData > initialData (edit mode) > EMPTY_FORM
      if (autoFillData && isAutoFilled) {
        // Auto-fill mode: use data from PDF extraction (disabled for now)
        setForm({
          blNumber: autoFillData.blNumber || "",
          shipperName: autoFillData.shipperName || "",
          consigneeName: autoFillData.consigneeName || "",
          vesselName: autoFillData.vesselName || "",
          voyage: autoFillData.voyage || "",
          portOfLoading: autoFillData.portOfLoading || "",
          portOfDischarge: autoFillData.portOfDischarge || "",
          eta: autoFillData.eta || "",
          customNotificationDate: "",
          alias: "",
          notes: "",
        });
      } else if (initialData && isEditMode) {
        // Edit mode: use existing shipment data
        setForm({
          blNumber: initialData.blNumber || "",
          shipperName: initialData.shipperName || "",
          consigneeName: initialData.consigneeName || "",
          vesselName: initialData.vesselName === "—" ? "" : (initialData.vesselName || ""),
          voyage: initialData.voyage === "—" ? "" : (initialData.voyage || ""),
          portOfLoading: initialData.portOfLoading === "—" ? "" : (initialData.portOfLoading || ""),
          portOfDischarge: initialData.portOfDischarge === "—" ? "" : (initialData.portOfDischarge || ""),
          eta: initialData.eta || "",
          customNotificationDate: initialData.customNotificationDate || "",
          alias: initialData.alias || "",
          notes: initialData.notes || "",
        });
      } else {
        // Create mode: empty form
        setForm(EMPTY_FORM);
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, initialData, isEditMode, autoFillData, isAutoFilled]);

  /** Handles text input changes — auto-uppercases all text values */
  function handleChange(e) {
    const { name, value, type } = e.target;
    // Date inputs should not be uppercased
    const newValue = type === "date" ? value : value.toUpperCase();
    setForm((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function validate() {
    const newErrors = {};
    if (!isEditMode && !form.blNumber.trim()) newErrors.blNumber = "B/L number is required";
    if (!form.shipperName.trim()) newErrors.shipperName = "Shipper name is required";
    if (!form.consigneeName.trim()) newErrors.consigneeName = "Consignee name is required";
    if (!form.eta) newErrors.eta = "ETA wajib diisi";
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    // Build clean payload — strip empty optional strings to null
    const payload = {};
    for (const [key, value] of Object.entries(form)) {
      if (isEditMode && key === "blNumber") continue;
      payload[key] = typeof value === "string" && value.trim() === "" ? null : value;
    }

    const result = await onSubmit(payload);

    setSubmitting(false);

    if (result.ok) {
      onClose();
    } else {
      const err = result.error;
      if (err?.field) {
        setErrors({ [err.field]: err.message });
      } else {
        setSubmitError(err?.message || "An error occurred. Please try again.");
      }
    }
  }

  if (!isOpen) return null;

  // Form content (shared between modal and embedded modes)
  const formContent = (
    <>
      {/* Overall confidence indicator */}
      {isAutoFilled && overallConfidence !== null && (
        <div className={`rounded-xl border px-4 py-3 ${
          overallConfidence >= 0.5 
            ? 'border-green-200 bg-green-50' 
            : 'border-yellow-200 bg-yellow-50'
        }`}>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900">
                Data diekstrak otomatis {extractionMethod === 'gemini' ? 'dengan AI' : 'dengan pattern matching'}
              </p>
              <p className="text-xs text-zinc-600">
                Tingkat kepercayaan: {(overallConfidence * 100).toFixed(0)}% — 
                {overallConfidence >= 0.5 
                  ? ' Silakan cek kembali sebelum menyimpan' 
                  : ' Mohon periksa dengan teliti, beberapa field mungkin kurang akurat'}
              </p>
            </div>
          </div>
        </div>
      )}
    
      {/* Datalist for clipboard buffer suggestions */}
      {clipboardBuffer.length > 0 && (
        <datalist id={datalistId}>
          {clipboardBuffer.map((item, index) => (
            <option key={index} value={item} />
          ))}
        </datalist>
      )}

      {/* B/L Number */}
      <FormField
        label="B/L Number"
        name="blNumber"
        value={form.blNumber}
        onChange={handleChange}
        readOnly={isEditMode}
        required={!isEditMode}
        error={errors.blNumber}
        placeholder="E.G. MSKU1234567"
        onFocus={onFieldFocus}
        onBlur={onFieldBlur}
        isActive={activeField === "blNumber"}
        datalistId={clipboardBuffer.length > 0 ? datalistId : undefined}
        confidence={isAutoFilled ? confidenceScores.blNumber : null}
      />

      {/* Alias - moved here below B/L Number */}
      <FormField
        label="Alias"
        name="alias"
        value={form.alias}
        onChange={handleChange}
        placeholder="SHORT FRIENDLY NAME FOR QUICK RECALL"
        onFocus={onFieldFocus}
        onBlur={onFieldBlur}
        isActive={activeField === "alias"}
        datalistId={clipboardBuffer.length > 0 ? datalistId : undefined}
        confidence={null}
      />

      {/* Required mutable fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Shipper Name"
              name="shipperName"
              value={form.shipperName}
              onChange={handleChange}
              required
              error={errors.shipperName}
              placeholder="SHIPPER COMPANY NAME"
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              isActive={activeField === "shipperName"}
              datalistId={clipboardBuffer.length > 0 ? datalistId : undefined}
              confidence={isAutoFilled ? confidenceScores.shipperName : null}
            />
            <FormField
              label="Consignee Name"
              name="consigneeName"
              value={form.consigneeName}
              onChange={handleChange}
              required
              error={errors.consigneeName}
              placeholder="CONSIGNEE COMPANY NAME"
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              isActive={activeField === "consigneeName"}
              datalistId={clipboardBuffer.length > 0 ? datalistId : undefined}
              confidence={isAutoFilled ? confidenceScores.consigneeName : null}
            />
          </div>

          {/* Optional vessel info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Vessel Name"
              name="vesselName"
              value={form.vesselName}
              onChange={handleChange}
              placeholder="E.G. MV EVER GIVEN"
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              isActive={activeField === "vesselName"}
              datalistId={clipboardBuffer.length > 0 ? datalistId : undefined}
              confidence={isAutoFilled ? confidenceScores.vesselName : null}
            />
            <FormField
              label="Voyage"
              name="voyage"
              value={form.voyage}
              onChange={handleChange}
              placeholder="E.G. 025W"
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              isActive={activeField === "voyage"}
              datalistId={clipboardBuffer.length > 0 ? datalistId : undefined}
              confidence={isAutoFilled ? confidenceScores.voyage : null}
            />
          </div>

          {/* Ports */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Port of Loading"
              name="portOfLoading"
              value={form.portOfLoading}
              onChange={handleChange}
              placeholder="E.G. SHANGHAI"
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              isActive={activeField === "portOfLoading"}
              datalistId={clipboardBuffer.length > 0 ? datalistId : undefined}
              confidence={isAutoFilled ? confidenceScores.portOfLoading : null}
            />
            <FormField
              label="Port of Discharge"
              name="portOfDischarge"
              value={form.portOfDischarge}
              onChange={handleChange}
              placeholder="E.G. TANJUNG PRIOK"
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              isActive={activeField === "portOfDischarge"}
              datalistId={clipboardBuffer.length > 0 ? datalistId : undefined}
              confidence={isAutoFilled ? confidenceScores.portOfDischarge : null}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="ETA"
              name="eta"
              type="date"
              value={form.eta}
              onChange={handleChange}
              required
              error={errors.eta}
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              isActive={activeField === "eta"}
              confidence={isAutoFilled ? confidenceScores.eta : null}
            />
            <FormField
              label="Custom Notification Date"
              name="customNotificationDate"
              type="date"
              value={form.customNotificationDate}
              onChange={handleChange}
              error={errors.customNotificationDate}
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              isActive={activeField === "customNotificationDate"}
              confidence={null}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-700">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="ADDITIONAL REMARKS..."
              className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm uppercase text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 resize-none"
            />
          </div>

          {submitError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {submitting && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {submitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Shipment"}
            </button>
          </div>
    </>
  );

  // If embedded mode, render without modal wrapper
  if (embedded) {
    return (
      <div className="h-full overflow-y-auto" ref={formContainerRef}>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-zinc-900">
            {isEditMode ? "Edit Shipment" : "New Shipment"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {formContent}
        </form>
      </div>
    );
  }

  // Regular modal mode
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-200 bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">
            {isEditMode ? "Edit Shipment" : "New Shipment"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {formContent}
        </form>
      </div>
    </div>
  );
}

function FormField({ 
  label, 
  name, 
  value, 
  onChange, 
  readOnly, 
  required, 
  error, 
  placeholder, 
  type = "text",
  onFocus,
  onBlur,
  isActive,
  datalistId,
  confidence = null
}) {
  // Determine confidence level styling
  const getConfidenceColor = () => {
    if (confidence === null || confidence === undefined) return null;
    if (confidence < 0.3) return 'red';
    if (confidence < 0.5) return 'yellow';
    return 'green';
  };
  
  const confidenceColor = getConfidenceColor();
  
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
        {readOnly && <span className="ml-1.5 text-xs font-normal text-zinc-400">(read-only)</span>}
        {isActive && datalistId && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
            💡 Suggestion tersedia
          </span>
        )}
        {confidence !== null && confidence !== undefined && (
          <span 
            className={`ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
              confidenceColor === 'red' 
                ? 'border-red-300 bg-red-100 text-red-700' 
                : confidenceColor === 'yellow'
                ? 'border-yellow-300 bg-yellow-100 text-yellow-700'
                : 'border-green-300 bg-green-100 text-green-700'
            }`}
            title={`Tingkat kepercayaan: ${(confidence * 100).toFixed(0)}% — ${
              confidence < 0.3 
                ? 'Rendah, mohon periksa dengan teliti' 
                : confidence < 0.5
                ? 'Sedang, mohon verifikasi'
                : 'Tinggi, kemungkinan akurat'
            }`}
          >
            {confidence < 0.3 ? '⚠️' : confidence < 0.5 ? '⚡' : '✓'} {(confidence * 100).toFixed(0)}%
          </span>
        )}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={(e) => onFocus?.(name, e)}
        onBlur={() => onBlur?.()}
        readOnly={readOnly}
        placeholder={placeholder}
        list={datalistId}
        autoComplete="on"
        className={`block w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 ${
          isActive && datalistId ? "ring-2 ring-blue-400 border-blue-400" : "focus-visible:ring-zinc-400"
        } ${
          type !== "date" ? "uppercase" : ""
        } ${
          readOnly
            ? "border-zinc-200 bg-zinc-100 text-zinc-500 cursor-not-allowed"
            : error
            ? "border-red-300 bg-red-50 text-zinc-700"
            : isActive && datalistId
            ? "border-blue-400 bg-blue-50 text-zinc-700"
            : confidenceColor === 'red'
            ? "border-red-300 bg-red-50 text-zinc-700"
            : confidenceColor === 'yellow'
            ? "border-yellow-300 bg-yellow-50 text-zinc-700"
            : "border-zinc-200 bg-zinc-50 text-zinc-700"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
