"use client";

/**
 * ShipmentForm Component
 * Presentation Layer — Feature component
 *
 * @description Modal form for creating and editing shipment records.
 * Immutable fields (shipmentNumber, blNumber) are read-only in edit mode.
 */

import React, { useState, useEffect } from "react";

const EMPTY_FORM = {
  shipmentNumber: "",
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
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSubmit: (data: Object) => Promise<{ok: boolean, error?: Object}>,
 *   initialData?: Object|null,
 *   isEditMode?: boolean,
 * }} props
 */
export default function ShipmentForm({ isOpen, onClose, onSubmit, initialData = null, isEditMode = false }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData && isEditMode) {
        setForm({
          shipmentNumber: initialData.shipmentNumber || "",
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
        setForm(EMPTY_FORM);
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, initialData, isEditMode]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function validate() {
    const newErrors = {};
    if (!isEditMode && !form.shipmentNumber.trim()) newErrors.shipmentNumber = "Shipment number is required";
    if (!isEditMode && !form.blNumber.trim()) newErrors.blNumber = "B/L number is required";
    if (!form.shipperName.trim()) newErrors.shipperName = "Shipper name is required";
    if (!form.consigneeName.trim()) newErrors.consigneeName = "Consignee name is required";
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
      if (isEditMode && (key === "shipmentNumber" || key === "blNumber")) continue;
      payload[key] = value.trim() === "" ? null : value.trim();
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
          {/* Immutable fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Shipment Number"
              name="shipmentNumber"
              value={form.shipmentNumber}
              onChange={handleChange}
              readOnly={isEditMode}
              required={!isEditMode}
              error={errors.shipmentNumber}
              placeholder="e.g. SHP-2025-001"
            />
            <FormField
              label="B/L Number"
              name="blNumber"
              value={form.blNumber}
              onChange={handleChange}
              readOnly={isEditMode}
              required={!isEditMode}
              error={errors.blNumber}
              placeholder="e.g. MSKU1234567"
            />
          </div>

          {/* Required mutable fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Shipper Name"
              name="shipperName"
              value={form.shipperName}
              onChange={handleChange}
              required
              error={errors.shipperName}
              placeholder="Shipper company name"
            />
            <FormField
              label="Consignee Name"
              name="consigneeName"
              value={form.consigneeName}
              onChange={handleChange}
              required
              error={errors.consigneeName}
              placeholder="Consignee company name"
            />
          </div>

          {/* Optional vessel info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Vessel Name"
              name="vesselName"
              value={form.vesselName}
              onChange={handleChange}
              placeholder="e.g. MV Ever Given"
            />
            <FormField
              label="Voyage"
              name="voyage"
              value={form.voyage}
              onChange={handleChange}
              placeholder="e.g. 025W"
            />
          </div>

          {/* Ports */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Port of Loading"
              name="portOfLoading"
              value={form.portOfLoading}
              onChange={handleChange}
              placeholder="e.g. Shanghai"
            />
            <FormField
              label="Port of Discharge"
              name="portOfDischarge"
              value={form.portOfDischarge}
              onChange={handleChange}
              placeholder="e.g. Tanjung Priok"
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
              error={errors.eta}
            />
            <FormField
              label="Custom Notification Date"
              name="customNotificationDate"
              type="date"
              value={form.customNotificationDate}
              onChange={handleChange}
              error={errors.customNotificationDate}
            />
          </div>

          {/* Alias & Notes */}
          <FormField
            label="Alias"
            name="alias"
            value={form.alias}
            onChange={handleChange}
            placeholder="Short friendly name for quick recall"
          />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-700">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Additional remarks..."
              className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 resize-none"
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
        </form>
      </div>
    </div>
  );
}

function FormField({ label, name, value, onChange, readOnly, required, error, placeholder, type = "text" }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
        {readOnly && <span className="ml-1.5 text-xs font-normal text-zinc-400">(read-only)</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`block w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
          readOnly
            ? "border-zinc-200 bg-zinc-100 text-zinc-500 cursor-not-allowed"
            : error
            ? "border-red-300 bg-red-50 text-zinc-700"
            : "border-zinc-200 bg-zinc-50 text-zinc-700"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
