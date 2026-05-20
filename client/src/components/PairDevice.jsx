import { useEffect, useRef, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import Icon from './Icon';
import { addKnownPeer, getDeviceId } from '../sync';
import { useT } from '../i18n';

export default function PairDevice({ onClose }) {
  const { t } = useT();
  const [deviceId, setDeviceId] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(null);
  const [manualId, setManualId] = useState('');
  const scannerInstance = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = await getDeviceId();
      if (cancelled) return;
      setDeviceId(id);
      try {
        const url = await QRCode.toDataURL(`offlinefirst:${id}`, {
          color: { dark: '#37352F', light: '#FFFFFF' },
          margin: 1,
          width: 200
        });
        if (!cancelled) setQrUrl(url);
      } catch (err) {
        console.log('QR generation failed:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    (async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (cancelled) return;
      try {
        const inst = new Html5Qrcode('qr-scanner-region');
        scannerInstance.current = inst;
        await inst.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            const id = decoded.startsWith('offlinefirst:') ? decoded.slice(13) : decoded;
            addKnownPeer(id);
            setScanned(id);
            inst.stop().catch(() => {});
            setScanning(false);
          },
          () => {}
        );
      } catch (err) {
        console.log('Scanner failed:', err);
        setScanning(false);
      }
    })();
    return () => {
      cancelled = true;
      if (scannerInstance.current) {
        scannerInstance.current.stop().catch(() => {});
        scannerInstance.current = null;
      }
    };
  }, [scanning]);

  const addManual = () => {
    const id = manualId.trim();
    if (!id) return;
    addKnownPeer(id);
    setScanned(id);
    setManualId('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button
          className="iconbtn"
          style={{ position: 'absolute', top: 12, right: 12 }}
          onClick={onClose}
          type="button"
          title={t('cancel')}
        >
          <Icon name="x" size={14} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Icon name="qr" size={18} color="var(--brand)" />
          <h2 className="h2" style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{t('pairTitleSentence')}</h2>
        </div>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
          {t('pairBlurb')}
        </p>

        {scanned && (
          <div style={{
            background: 'var(--brand-soft)',
            border: '1px solid var(--brand-soft)',
            color: 'var(--brand)',
            padding: '10px 14px', borderRadius: 'var(--r-md)',
            fontSize: 13, fontWeight: 600, marginBottom: 16, wordBreak: 'break-all'
          }}>
            ✓ {t('pairedConfirm')}: {scanned}
          </div>
        )}

        {!scanning && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 18, marginBottom: 16,
              background: 'var(--surface-2)', border: '1px solid var(--rule)',
              borderRadius: 'var(--r-md)'
            }}>
              {qrUrl
                ? <img src={qrUrl} alt="Device pairing QR" style={{ width: 200, height: 200, display: 'block' }} />
                : <div style={{ width: 200, height: 200, background: 'var(--rule)', borderRadius: 4 }} />}
            </div>

            <div className="label" style={{ textAlign: 'center', marginBottom: 4 }}>{t('yourDeviceId')}</div>
            <div className="mono" style={{ textAlign: 'center', color: 'var(--brand)', marginBottom: 20, letterSpacing: '0.05em' }}>{deviceId}</div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
              onClick={() => setScanning(true)}
              type="button"
            >
              <Icon name="qr" size={15} /> {t('scanAnotherDevice')}
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="text-input"
                placeholder="of_xxxxxxxx"
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn btn-secondary" onClick={addManual} disabled={!manualId.trim()} type="button">
                {t('add')}
              </button>
            </div>
          </>
        )}

        {scanning && (
          <>
            <div
              id="qr-scanner-region"
              style={{
                width: '100%', maxWidth: 320, margin: '0 auto 16px',
                background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden'
              }}
            />
            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setScanning(false)}
              type="button"
            >
              {t('cancel')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
