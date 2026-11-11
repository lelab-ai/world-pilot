import React, { useState, useEffect } from 'react';

export interface VictoriaVRNftPayload {
  nftName: string;
  token: string;
  simulationId: string;
  simulated: boolean;
  timestamp: string;
}

export const Web3TransactionModal: React.FC = () => {
  const [tx, setTx] = useState<VictoriaVRNftPayload | null>(null);

  useEffect(() => {
    const handleMint = (e: any) => {
      if (e.detail) {
        setTx(e.detail);
      }
    };

    window.addEventListener('victoria_vr_mint', handleMint);
    return () => window.removeEventListener('victoria_vr_mint', handleMint);
  }, []);

  if (!tx) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: '"Inter", "Segoe UI", sans-serif'
    }}>
      <div style={{
        width: '480px',
        background: 'linear-gradient(145deg, #090b14, #04050a)',
        border: '1px solid #00ffff',
        boxShadow: '0 0 35px rgba(0, 255, 255, 0.4), inset 0 0 15px rgba(0, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '30px',
        color: '#ffffff',
        position: 'relative',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        {/* Top Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffaa00', boxShadow: '0 0 8px #ffaa00' }} />
            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', color: '#00ffff', textTransform: 'uppercase' }}>
              WorldPilot • Simulation Locale
            </span>
          </div>
          <button 
            onClick={() => setTx(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* NFT Preview & Simulation Notice */}
        <div style={{ textAlign: 'center', margin: '15px 0 25px 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,255,255,0.25) 0%, rgba(0,68,255,0.1) 70%)',
            border: '2px solid #00ffff',
            boxShadow: '0 0 20px rgba(0,255,255,0.5)',
            fontSize: '28px',
            marginBottom: '15px'
          }}>
            💎
          </div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', color: '#ffffff', letterSpacing: '0.5px' }}>
            {tx.nftName}
          </h2>
          <div style={{ fontSize: '13px', color: '#ffaa00', fontWeight: 'bold' }}>
            ⚠ SIMULATION — INTÉGRATION ON-CHAIN NON CONNECTÉE
          </div>
        </div>

        {/* Simulation Details Card */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(0, 255, 255, 0.2)',
          borderRadius: '10px',
          padding: '16px',
          fontSize: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '25px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Token :</span>
            <span style={{ color: '#00ffff', fontWeight: 'bold' }}>{tx.token}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Identifiant de simulation :</span>
            <span style={{ fontFamily: 'monospace', color: '#ffaa00' }}>
              {tx.simulationId.substring(0, 10)}...{tx.simulationId.substring(tx.simulationId.length - 8)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Horodatage :</span>
            <span style={{ color: '#888' }}>{tx.timestamp}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            Aucune transaction on-chain réelle n'a été effectuée. Aucun contrat, réseau ni frais ne s'applique.
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setTx(null)}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, #0044ff, #00ffff)',
              color: '#000000',
              fontWeight: 'bold',
              fontSize: '13px',
              letterSpacing: '0.5px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
