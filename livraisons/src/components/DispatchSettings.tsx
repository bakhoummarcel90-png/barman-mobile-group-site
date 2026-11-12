"use client";

import { dispatchSettingsAction } from "@/app/actions";
import { OPTIONS, VEHICLE_TYPES, type OptionCode, type Tariffs } from "@/lib/pricing";
import { ActionForm, SubmitButton } from "./forms";

export function DispatchSettings({ mode, tariffs, currencyLabel }: { mode: string; tariffs: Tariffs; currencyLabel: string }) {
  return (
    <ActionForm action={dispatchSettingsAction}>
      <fieldset className="space-y-2">
        <legend className="label">Attribution des courses</legend>
        <label className="flex items-start gap-2 text-sm">
          <input type="radio" name="dispatch_mode" value="manuel" defaultChecked={mode !== "bourse"} className="mt-1" />
          <span>
            <strong>Manuelle</strong> — vous choisissez le livreur de chaque commande.
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="radio" name="dispatch_mode" value="bourse" defaultChecked={mode === "bourse"} className="mt-1" />
          <span>
            <strong>Bourse aux courses</strong> — les commandes à attribuer s'affichent dans « Courses dispo » des livreurs ayant le bon véhicule ;
            le premier qui accepte obtient la course. Vous pouvez toujours attribuer à la main.
          </span>
        </label>
      </fieldset>
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Véhicule</th>
              <th>Prise en charge</th>
              <th>Par km</th>
              <th>Minimum</th>
            </tr>
          </thead>
          <tbody>
            {VEHICLE_TYPES.map((v) => (
              <tr key={v}>
                <td className="font-medium">{v}</td>
                {(["base", "perKm", "min"] as const).map((k) => (
                  <td key={k}>
                    <input name={`${v}_${k}`} defaultValue={tariffs.vehicles[v][k]} inputMode="numeric" className="input w-28" aria-label={`${v} ${k}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(OPTIONS) as OptionCode[]).map((o) => (
          <label key={o} className="text-sm">
            <span className="label">
              {OPTIONS[o]} ({currencyLabel})
            </span>
            <input name={`option_${o}`} defaultValue={tariffs.options[o]} inputMode="numeric" className="input" />
          </label>
        ))}
      </div>
      <p className="text-xs text-ink-muted">
        Prix = prise en charge + prix au km × distance estimée entre les quartiers (au moins le minimum) + options, arrondi à la centaine.
        L'administrateur peut toujours saisir un autre prix sur une commande.
      </p>
      <SubmitButton>Enregistrer</SubmitButton>
    </ActionForm>
  );
}
