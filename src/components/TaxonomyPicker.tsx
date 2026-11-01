'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { TaxonomyTag, TaxonomyTree, TutorTaxonomySelection } from '@/types/taxonomy';
import { getTaxonomyTree } from '@/data/taxonomySeed';
import { validateTagForCreateClient } from '@/lib/tagBlocklistClient';
import { MAX_TAGS_PER_TUTOR, normalizeTagInput } from '@/lib/tagNormalize';
import { fetchPublicMenuTags } from '@/lib/taxonomyService';

interface TaxonomyPickerProps {
  value: TutorTaxonomySelection;
  onChange: (next: TutorTaxonomySelection) => void;
  tree?: TaxonomyTree[];
  error?: string;
  /** 最多標籤數（預設 5） */
  maxTags?: number;
}

/**
 * 三層選單：大類 → 子類 → 建議／公共標籤 + 自訂新增（正規化／黑名單／上限）
 */
export function TaxonomyPicker({
  value,
  onChange,
  tree,
  error,
  maxTags = MAX_TAGS_PER_TUTOR,
}: TaxonomyPickerProps) {
  const taxonomy = tree && tree.length > 0 ? tree : getTaxonomyTree();
  const [customInput, setCustomInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [publicTags, setPublicTags] = useState<TaxonomyTag[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicMenuTags(30).then((tags) => {
      if (!cancelled) setPublicTags(tags);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const category = taxonomy.find((c) => c.id === value.categoryId) || taxonomy[0];
  const subcategories = category?.subcategories || [];
  const subcategory =
    subcategories.find((s) => s.id === value.subcategoryId) || subcategories[0];

  const selectedKeys = useMemo(() => {
    return new Set(
      value.tags.map((t) => normalizeTagInput(t).name).filter(Boolean)
    );
  }, [value.tags]);

  const suggested = useMemo(() => {
    const base = [
      ...(subcategory?.suggestedTags || []),
      ...publicTags
        .filter(
          (t) =>
            !t.categoryId ||
            t.categoryId === value.categoryId ||
            t.subcategoryId === value.subcategoryId
        )
        .map((t) => t.displayName || t.name),
    ];
    const uniq: string[] = [];
    const seen = new Set<string>();
    for (const tag of base) {
      const key = normalizeTagInput(tag).name;
      if (!key || seen.has(key) || selectedKeys.has(key)) continue;
      seen.add(key);
      uniq.push(tag);
    }
    return uniq.slice(0, 16);
  }, [subcategory, publicTags, value.categoryId, value.subcategoryId, selectedKeys]);

  const setCategory = (categoryId: string) => {
    const cat = taxonomy.find((c) => c.id === categoryId);
    const firstSub = cat?.subcategories[0];
    onChange({
      categoryId,
      subcategoryId: firstSub?.id || '',
      tags: value.tags,
    });
  };

  const setSubcategory = (subcategoryId: string) => {
    onChange({ ...value, subcategoryId });
  };

  const toggleTag = (tag: string) => {
    setLocalError(null);
    const key = normalizeTagInput(tag).name;
    const existing = value.tags.find((t) => normalizeTagInput(t).name === key);
    if (existing) {
      onChange({
        ...value,
        tags: value.tags.filter((t) => normalizeTagInput(t).name !== key),
      });
      return;
    }
    if (value.tags.length >= maxTags) {
      setLocalError(`每位老師最多 ${maxTags} 個標籤`);
      return;
    }
    const validated = validateTagForCreateClient(tag);
    if (!validated.ok) {
      setLocalError(validated.message || '標籤無效');
      return;
    }
    onChange({ ...value, tags: [...value.tags, validated.displayName] });
  };

  const addCustom = () => {
    setLocalError(null);
    const validated = validateTagForCreateClient(customInput);
    if (!validated.ok) {
      setLocalError(validated.message || '標籤無效');
      return;
    }
    if (selectedKeys.has(validated.name)) {
      setCustomInput('');
      return;
    }
    if (value.tags.length >= maxTags) {
      setLocalError(`每位老師最多 ${maxTags} 個標籤`);
      return;
    }
    onChange({ ...value, tags: [...value.tags, validated.displayName] });
    setCustomInput('');
  };

  const showError = localError || error;

  return (
    <div className="space-y-4" role="group" aria-label="技能與科目分類">
      <div>
        <p className="block text-xs font-medium text-slate-700 mb-1.5">大類</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {taxonomy.map((cat) => {
            const active = cat.id === (category?.id || value.categoryId);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`text-left rounded-2xl border px-3 py-2.5 text-[12px] leading-snug transition cursor-pointer ${
                  active
                    ? 'border-brand-500 bg-brand-50 text-brand-700 font-semibold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="block text-xs font-medium text-slate-700 mb-1.5">常見子類</p>
        <div className="flex flex-wrap gap-1.5">
          {subcategories.map((sub) => {
            const active = sub.id === (subcategory?.id || value.subcategoryId);
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSubcategory(sub.id)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {sub.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="block text-xs font-medium text-slate-700 mb-1.5">
          專長標籤 <span className="text-brand-500">*</span>
          <span className="text-slate-400 font-normal ml-1">
            （最多 {maxTags} 個・2–20 字・自訂標籤僅顯示於個人頁至達熱門門檻）
          </span>
        </p>
        {suggested.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {suggested.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-dashed border-slate-300 text-slate-600 hover:border-slate-500 bg-white transition cursor-pointer"
              >
                + {tag}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="自訂標籤（多國語言字母／數字）"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
            aria-label="自訂新增標籤"
            maxLength={40}
          />
          <button
            type="button"
            onClick={addCustom}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            自訂新增
          </button>
        </div>

        {value.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {value.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[11px] bg-rose-50 text-rose-700 border border-rose-200/60 px-2.5 py-1 rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="leading-none cursor-pointer"
                  aria-label={`移除 ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {showError && <p className="text-xs text-rose-500 mt-1">{showError}</p>}
      </div>
    </div>
  );
}
