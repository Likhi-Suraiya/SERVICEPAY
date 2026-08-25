// src/api/lookupapi.js — fetch-based (proven working path through the Vite proxy)
import { API_BASE_URL , AUTH_USERNAME,AUTH_PASSWORD } from "./baseurl";

const USER = AUTH_USERNAME;
const PASS = AUTH_PASSWORD;
const SKEYL = import.meta.env.VITE_S_KEYL;

const AUTH = "Basic " + btoa(`${USER}:${PASS}`);


let cache = null;
let inflight = null;

export const getLookups = async (force = false) => {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;

  inflight = fetch(`${API_BASE_URL}/BlilLookup/All`, {
    headers: { Accept: "application/json", Authorization: AUTH, S_KEYL: SKEYL },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Lookup HTTP ${res.status}`);
      return res.json();
    })
    .then((body) => {
      const raw = body.data ?? body.Data ?? {};
      cache = {
        zones: (raw.zones ?? []).map((z) => ({
          zoneId: z.zoneId, zoneName: z.zoneName,
          zsmName: z.zsmName, zsmCell: z.zsmCell,
        })),
        districts: (raw.districts ?? []).map((d) => ({
          districtCode: d.districtCode, districtName: d.districtName,
        })),
        thanas: (raw.thanas ?? []).map((t) => ({
          thanaCode: t.thanaCode, thanaName: t.thanaName, districtCode: t.districtCode,
        })),
        concernPersons: (raw.concernPersons ?? []).map((p) => ({
          staffId: p.staffId ?? p.personId,
          staffName: p.staffName ?? p.personName,
        })),
        assetTypes: (raw.assetTypes ?? []).map((a) => ({
          assetType: a.assetType, assetName: a.assetName,
        })),
        assetModels: (raw.assetModels ?? []).map((m) => ({
          assetType: m.assetType, modelName: m.modelName,
        })),
      };
      return cache;
    })
    .finally(() => { inflight = null; });

  return inflight;
};