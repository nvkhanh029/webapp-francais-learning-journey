import { t, useLanguage } from "../../../i18n/index.js";

// Sentence Ordering (FD §5.4.7, FD §7.12, API §14.3).
//
// Two lists: the placed pieces in the order the learner built, and the remaining pool. Tapping a chip
// moves it between them, so the interaction is keyboard- and tap-friendly and never depends on
// drag-and-drop (FD §7.12).
//
// The answer is the array of `item_id`s in the chosen order, which is what the contract expects on
// submit (API §17.1). `correct_position` is never present at this stage (API §14.3), and the backend
// already returns the pieces in a non-canonical order (API §14.3).
//
// Known limitation, not a bug: an Ordering question's `prompt` is an instruction and the contract has
// no field for a native-language source sentence, so only the instruction and the French pieces are
// shown. Nothing is invented to fill the gap (FD §7.12).
export default function OrderingQuestion({ question, answer, onAnswer }) {
  useLanguage();

  const items = question.items ?? [];
  const placedIds = answer?.item_ids ?? [];
  const byId = new Map(items.map((item) => [item.item_id, item]));
  const placed = placedIds.map((id) => byId.get(id)).filter(Boolean);
  const pool = items.filter((item) => !placedIds.includes(item.item_id));

  const place = (itemId) => onAnswer({ item_ids: [...placedIds, itemId] });
  const remove = (index) => onAnswer({ item_ids: placedIds.filter((_, position) => position !== index) });

  const sentence = placed.map((item) => item.text).join(" ");

  return (
    <div>
      <div className="ordering-heading">
        <h3 className="ordering-title" id="slots-title">
          {t("practice.orderYourSentence")}
        </h3>
        <button
          className="button button-secondary button-compact"
          type="button"
          disabled={placed.length === 0}
          onClick={() => onAnswer({ item_ids: [] })}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            refresh
          </span>
          <span>{t("practice.orderReset")}</span>
        </button>
      </div>

      <ol className="ordering-slots" aria-labelledby="slots-title" lang="fr">
        {placed.length === 0 ? (
          <li className="ordering-empty">{t("practice.orderEmpty")}</li>
        ) : (
          placed.map((item, index) => (
            <li key={item.item_id}>
              <button className="chip chip-placed" type="button" onClick={() => remove(index)}>
                <span className="chip-order" aria-hidden="true">
                  {index + 1}
                </span>
                <span>{item.text}</span>
                <span className="material-symbols-outlined" aria-hidden="true">
                  close
                </span>
                <span className="visually-hidden">{t("practice.orderPosition", { n: index + 1 })}</span>
              </button>
            </li>
          ))
        )}
      </ol>

      <h3 className="ordering-title ordering-title-pool" id="pool-title">
        {t("practice.orderPool")}
      </h3>
      <ul className="ordering-pool" aria-labelledby="pool-title" lang="fr">
        {pool.length === 0 ? (
          <li className="ordering-empty">{t("practice.orderUsedAll")}</li>
        ) : (
          pool.map((item) => (
            <li key={item.item_id}>
              <button className="chip" type="button" onClick={() => place(item.item_id)}>
                <span>{item.text}</span>
                <span className="visually-hidden">{t("practice.orderAdd")}</span>
              </button>
            </li>
          ))
        )}
      </ul>

      {/* Announced after every change so the built sentence is available without reading the chips. */}
      <p className="visually-hidden" role="status">
        {placed.length > 0 ? t("practice.orderCurrent", { sentence }) : t("practice.orderNone")}
      </p>
    </div>
  );
}
