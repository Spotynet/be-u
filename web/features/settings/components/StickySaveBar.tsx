"use client";

type Props = {
  visible: boolean;
  saving?: boolean;
  message?: string;
  onDiscard: () => void;
  onSave: () => void;
  saveLabel?: string;
};

export function StickySaveBar({
  visible,
  saving = false,
  message = "Tienes cambios sin guardar",
  onDiscard,
  onSave,
  saveLabel = "Guardar cambios",
}: Props) {
  return (
    <div
      role="region"
      aria-label="Cambios sin guardar"
      aria-hidden={!visible}
      className={[
        "nabbi-settings-savebar",
        visible ? "is-visible" : "",
      ].join(" ")}>
      <div className="nabbi-settings-savebar__inner">
        <p className="nabbi-settings-savebar__msg" aria-live="polite">
          {visible ? (
            <>
              <span className="nabbi-settings-dirty-dot" aria-hidden />
              <span>{message}</span>
            </>
          ) : null}
        </p>
        <div className="nabbi-settings-savebar__actions">
          <button
            type="button"
            className="nabbi-settings-savebar__discard"
            disabled={saving || !visible}
            onClick={onDiscard}>
            Descartar
          </button>
          <button
            type="button"
            className="nabbi-settings-savebar__save"
            disabled={saving || !visible}
            onClick={onSave}
            aria-busy={saving || undefined}>
            {saving ? (
              <>
                <span className="nabbi-settings-savebar__spinner" aria-hidden />
                Guardando…
              </>
            ) : (
              saveLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
