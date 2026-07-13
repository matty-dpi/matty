import { useState } from "react";
import { AvatarCall } from "@runwayml/avatars-react";
import "@runwayml/avatars-react/styles.css";
import "@/AvatarTest.css";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
// Matty's custom Runway character.
const AVATAR_ID = "cb17cc4c-9725-4df7-94d5-780e4912c6aa";

export default function AvatarTest() {
  const [live, setLive] = useState(false);
  const [err, setErr] = useState("");

  return (
    <div className="avt-wrap" data-testid="avatar-test-page">
      <header className="avt-head">
        <div className="avt-eyebrow">TEST · INLINE AVATAR</div>
        <h1 className="avt-title">Talk to Matty</h1>
        <p className="avt-sub">
          A large-format, inline version of the interactive avatar. Click connect and allow your
          microphone to start a live conversation.
        </p>
      </header>

      <div className="avt-stage" data-testid="avatar-stage">
        {!live ? (
          <div className="avt-gate">
            <button className="avt-connect" onClick={() => { setErr(""); setLive(true); }} data-testid="avatar-connect-btn">
              Connect to Avatar
            </button>
            <div className="avt-hint">Requires microphone access</div>
          </div>
        ) : (
          <div className="avt-call">
            <AvatarCall
              avatarId={AVATAR_ID}
              connectUrl={`${API}/avatar/connect`}
              onError={(e) => { setErr((e && e.message) || "Connection error"); }}
            />
          </div>
        )}
      </div>

      {err && <div className="avt-error" data-testid="avatar-error">{err}</div>}

      {live && (
        <button className="avt-end" onClick={() => setLive(false)} data-testid="avatar-end-btn">
          End &amp; reset
        </button>
      )}
    </div>
  );
}
