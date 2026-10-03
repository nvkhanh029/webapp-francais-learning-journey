import { Fragment } from "react";

// Page title block of a browse page (FD §7.8–§7.10): module icon tile, h1 and short description.
// `glyphs` are optional decorative French letters set after the title.
export default function PageHeader({ icon, title, description, glyphs }) {
  return (
    <div className="hero-intro">
      <div className="icon-tile icon-tile-solid" aria-hidden="true">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <h1 className="page-title" id="page-title">
          {title}
          {glyphs && (
            <span className="title-glyphs" lang="fr" aria-hidden="true">
              {glyphs.map((glyph, index) => (
                <Fragment key={glyph}>
                  {index > 0 && " "}
                  <span>{glyph}</span>
                </Fragment>
              ))}
            </span>
          )}
        </h1>
        <p className="page-description">{description}</p>
      </div>
    </div>
  );
}
