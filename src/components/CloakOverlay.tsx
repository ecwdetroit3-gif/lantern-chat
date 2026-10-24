import { usePrefs } from '../lib/prefs';
import { useCloak } from '../lib/cloak-context';
import { shortcutLabel } from '../lib/cloak';

// Full-screen, functional notepad shown while cloaked. It is a real scratch
// pad: whatever you type is autosaved locally. Restoring ORBIT is done with the
// unobtrusive control at the top-right, or the configured keyboard shortcut.
export default function CloakOverlay() {
  const { prefs, setCloakNote } = usePrefs();
  const { active, deactivate } = useCloak();
  if (!active) return null;

  const text = prefs.cloakNote;
  const lines = text ? text.split('\n').length : 1;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="cloak" role="dialog" aria-label="Notepad">
      <div className="cloak-menu">
        <span className="cm">File</span>
        <span className="cm">Edit</span>
        <span className="cm">Format</span>
        <span className="cm">View</span>
        <span className="cm">Help</span>
        <span className="cm-right">
          <span style={{ color: '#999' }} title={`Restore shortcut: ${shortcutLabel(prefs.cloak.shortcut)}`}>
            {shortcutLabel(prefs.cloak.shortcut)}
          </span>
          <button className="cloak-restore" onClick={deactivate} title="Restore ORBIT">
            ●
          </button>
        </span>
      </div>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setCloakNote(e.target.value)}
        placeholder=""
        spellCheck
        aria-label="Notepad text"
      />
      <div className="cloak-foot">
        <span>
          Ln {lines}, Col {chars}
        </span>
        <span>
          {words} words · Press {shortcutLabel(prefs.cloak.shortcut)} or click ● to restore
        </span>
      </div>
    </div>
  );
}
