import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addWorkType,
  buildWorkTypeDefinitionFromLabel,
  deleteWorkType,
  ensureDefaultWorkTypesInFirestore,
  getWorkTypeLabel,
} from "@/lib/workTypes";
import { useWorkTypes } from "@/hooks/use-work-types";

export default function AdminWorkTypes() {
  const { workTypes } = useWorkTypes();
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    ensureDefaultWorkTypesInFirestore().catch((error) => {
      console.error("Failed to seed work types:", error);
    });
  }, []);

  const sortedWorkTypes = useMemo(
    () => [...workTypes].sort((a, b) => getWorkTypeLabel(a.id, true).localeCompare(getWorkTypeLabel(b.id, true), "gu")),
    [workTypes]
  );

  const handleAdd = async () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;

    const candidate = buildWorkTypeDefinitionFromLabel(trimmed);
    const duplicate = workTypes.some((entry) =>
      getWorkTypeLabel(entry.id, true).trim().toLowerCase() === trimmed.toLowerCase()
    );
    const duplicateId = workTypes.some((entry) => entry.id === candidate.id);
    if (duplicate) {
      alert("આ પ્રકાર પહેલેથી ઉપલબ્ધ છે");
      return;
    }
    if (duplicateId) {
      alert("આ પ્રકારનો નામ પહેલેથી છે. કૃપા કરીને અલગ નામ દાખલ કરો");
      return;
    }

    setSaving(true);
    try {
      await addWorkType(trimmed);
      setNewLabel("");
    } catch (error) {
      console.error("Error adding work type:", error);
      alert("નવો પ્રકાર ઉમેરવામાં ભૂલ આવી");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("શું તમે ખરેખર આ કામનો પ્રકાર કાઢી નાખવા માગો છો?")) return;
    setDeletingId(id);
    try {
      await deleteWorkType(id);
    } catch (error) {
      console.error("Error deleting work type:", error);
      alert("કામનો પ્રકાર કાઢવામાં ભૂલ આવી");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
        <h3 className="text-xl font-bold text-primary-dark mb-4">કામના પ્રકાર મેનેજ કરો</h3>
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="દા.ત. 🧰 ફર્નિચર કસ્ટમ"
            className="border-border"
          />
          <Button
            onClick={handleAdd}
            disabled={saving || !newLabel.trim()}
            className="bg-primary text-white hover:bg-primary-dark"
          >
            {saving ? "ઉમેરાઈ રહ્યું છે..." : "ઉમેરો"}
          </Button>
        </div>
        <p className="text-xs text-secondary mt-3">
          અહીં ઉમેરેલા પ્રકારો પ્રોજેક્ટ, ફોટો અપલોડ અને ગેલેરીમાં તરત દેખાશે.
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-primary-dark">વર્તમાન પ્રકારો</h4>
          <span className="text-xs text-secondary">કુલ: {sortedWorkTypes.length}</span>
        </div>
        {sortedWorkTypes.length === 0 ? (
          <p className="text-secondary">હજી કોઈ પ્રકાર નથી</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedWorkTypes.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between border border-border rounded-lg px-4 py-3"
              >
                <span className="font-medium text-primary-dark">{getWorkTypeLabel(entry.id, true)}</span>
                <Button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  className="border border-border text-secondary"
                >
                  {deletingId === entry.id ? "કાઢી રહ્યું છે..." : "કાઢો"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
