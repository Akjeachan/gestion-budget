import React, { useState } from "react";
import "../styles/MultiSelectArticles.css";

function MultiSelectArticles({ articles = [], selectedArticles = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCheckChange = (articleRef) => {
    const newSelected = selectedArticles.includes(articleRef)
      ? selectedArticles.filter((ref) => ref !== articleRef)
      : [...selectedArticles, articleRef];
    onChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedArticles.length === articles.length) {
      onChange([]);
    } else {
      onChange(articles.map((a) => a.aR_Ref));
    }
  };

  const getSelectedLabels = () => {
    if (selectedArticles.length === 0) {
      return "-- Sélectionnez des articles --";
    }
    if (selectedArticles.length === 1) {
      const article = articles.find((a) => a.aR_Ref === selectedArticles[0]);
      return article?.aR_Design || "";
    }
    return `${selectedArticles.length} article(s) sélectionné(s)`;
  };

  return (
    <div className="multiselect-container">
      <button
        type="button"
        className="multiselect-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{getSelectedLabels()}</span>
        <span className="arrow">{"▼"}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="multiselect-backdrop"
            onClick={() => setIsOpen(false)}
          />
          <div className="multiselect-dropdown">
            {/* Select All Option */}
            <div className="multiselect-option">
              <label className="checkbox-label select-all">
                <input
                  type="checkbox"
                  checked={
                    articles.length > 0 &&
                    selectedArticles.length === articles.length
                  }
                  onChange={handleSelectAll}
                />
                <span>Sélectionner tous</span>
              </label>
            </div>

            {/* Divider */}
            {articles.length > 0 && (
              <div className="multiselect-divider"></div>
            )}

            {/* Article List */}
            {Array.isArray(articles) && articles.length > 0 ? (
              articles.map((article) => (
                <div key={article.aR_Ref} className="multiselect-option">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedArticles.includes(article.aR_Ref)}
                      onChange={() => handleCheckChange(article.aR_Ref)}
                    />
                    <span>{article.aR_Design}</span>
                  </label>
                </div>
              ))
            ) : (
              <div className="multiselect-empty">
                Aucun article disponible
              </div>
            )}
          </div>
        </>
      )}

      {/* Display selected items as chips */}
      {selectedArticles.length > 0 && (
        <div className="selected-chips">
          {selectedArticles.map((ref) => {
            const article = articles.find((a) => a.aR_Ref === ref);
            return (
              <div key={ref} className="chip">
                <span>{article?.aR_Design}</span>
                <button
                  type="button"
                  onClick={() => handleCheckChange(ref)}
                  className="chip-remove"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MultiSelectArticles;
