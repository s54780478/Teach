'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import type { TutorTaxonomySelection } from '@/types/taxonomy';
import { MAIN_CATEGORIES } from '@/data/mainCategories';
import { isMainCategoryKey } from '@/types/mainCategory';
import { validateTagForCreateClient } from '@/lib/tagBlocklistClient';
import { MAX_TAGS_PER_TUTOR, normalizeTagInput } from '@/lib/tagNormalize';
import { fetchPopularTagsWithFallback } from '@/lib/fetchPopularTags';

interface TaxonomyPickerProps {
  value: TutorTaxonomySelection;
  onChange: (next: TutorTaxonomySelection) => void;
  error?: string;
  /** 最多標籤數（預設 5） */
  maxTags?: number;
}

/**
 * 二層結構：固定 8 大類單選 → Steam 式熱門標籤 Quick-add + 自訂輸入
 */
export function TaxonomyPicker({
  value,
  onChange,
  error,
  maxTags = MAX_TAGS_PER_TUTOR,
}: TaxonomyPickerProps) {
  const [customInput, setCustomInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  const categoryId = isMainCategoryKey(value.categoryId)
    ? value.categoryId
    : MAIN_CATEGORIES[0].key;

  const selectedKeys = useMemo(() => {
    return new Set(
      value.tags.map((t) => normalizeTagInput(t).name).filter(Boolean)
    );
  }, [value.tags]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setTagsLoading(true);

    const timer = window.setTimeout(() => {
      void fetchPopularTagsWithFallback(categoryId, {
        signal: controller.signal,
      })
        .then((result) => {
          if (cancelled) return;
          setPopularTags(result.tags.map((t) => t.tag));
        })
        .catch(() => {
          if (!cancelled) setPopularTags([]);
        })
        .finally(() => {
          if (!cancelled) setTagsLoading(false);
        });
    }, 100);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [categoryId]);

  const quickAddTags = useMemo(() => {
    return popularTags.filter((tag) => {
      const key = normalizeTagInput(tag).name;
      return key && !selectedKeys.has(key);
    });
  }, [popularTags, selectedKeys]);

  const setCategory = (nextCategoryId: string) => {
    if (!isMainCategoryKey(nextCategoryId)) return;
    onChange({
      categoryId: nextCategoryId,
      tags: value.tags,
    });
    setLocalError(null);
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
    onChange({
      ...value,
      tags: [...value.tags, validated.displayName],
    });
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
    onChange({
      ...value,
      tags: [...value.tags, validated.displayName],
    });
    setCustomInput('');
  };

  const showError = localError || error;

  return (
    <div className="space-y-4" role="group" aria-label="主要大類與專長標籤">
      <div>
        <p className="block text-xs font-medium text-slate-700 mb-1.5">
          主要大類 <span className="text-brand-500">*</span>
          <span className="text-slate-400 font-normal ml-1">（單選・以主要教學目的為準）</span>
        </p>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
          role="radiogroup"
          aria-label="主要大類"
        >
          {MAIN_CATEGORIES.map((cat) => {
            const active = cat.key === categoryId;
            return (
              <button
                key={cat.key}
                type="button"
                role="radio"
                aria-checked={active}
                title={cat.description}
                onClick={() => setCategory(cat.key)}
                className={`text-left rounded-2xl border px-3 py-2.5 text-[12px] leading-snug transition cursor-pointer ${
                  active
                    ? 'border-brand-500 bg-brand-50 text-brand-700 font-semibold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="block text-xs font-medium text-slate-700 mb-1.5">
          專長標籤 <span className="text-brand-500">*</span>
          <span className="text-slate-400 font-normal ml-1">
            （最多 {maxTags} 個・可快捷加入或自訂）
          </span>
        </p>

        <div className="mb-3 min-h-[28px]" aria-busy={tagsLoading}>
          {tagsLoading && quickAddTags.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              載入熱門標籤…
            </span>
          ) : quickAddTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5" aria-label="熱門標籤快捷加入">
              {quickAddTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  disabled={value.tags.length >= maxTags}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-dashed border-slate-300 text-slate-600 hover:border-slate-500 bg-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  + {tag}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-slate-400">
              此大類尚無足夠熱門標籤，請直接自訂新增。
            </p>
          )}
        </div>

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
            placeholder="自訂標籤（例：日文會話、Python）"
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
        <p className="text-[11px] text-slate-400 mt-1.5">
          已選 {value.tags.length}/{maxTags}
        </p>
        {showError && <p className="text-xs text-rose-500 mt-1">{showError}</p>}
      </div>
    </div>
  );
}
