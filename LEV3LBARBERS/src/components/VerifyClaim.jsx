import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import styled from 'styled-components';
import api from '../utils/api';
import { ScanIcon, CheckIcon } from '../common/icons';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const VerifyClaim = () => {
  const [isScanning, setIsScanning]     = useState(false);
  const [verifying, setVerifying]       = useState(false);
  const [result, setResult]             = useState(null);   // { customerName, rewardValue, ... }
  const [error, setError]               = useState('');

  const reset = () => {
    setResult(null);
    setError('');
  };

  // @yudiel/react-qr-scanner v2 passes an array of IDetectedBarcode
  const handleScan = (detectedCodes) => {
    if (!detectedCodes?.length) return;
    const rawValue = detectedCodes[0].rawValue;
    setIsScanning(false);
    verifyClaim(rawValue);
  };

  const handleScanError = (err) => {
    console.error('Scanner error:', err);
    setError('Camera error. Please try again.');
    setIsScanning(false);
  };

  const verifyClaim = async (token) => {
    setVerifying(true);
    setResult(null);
    setError('');
    try {
      const res = await api.post('/rewards/verify-claim', { token });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or already-used QR code.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <FormCard>
      <PanelTitle>Verify Reward Claim</PanelTitle>

      {!result && (
        <>
          <ScanButton
            onClick={() => { reset(); setIsScanning((prev) => !prev); }}
            $active={isScanning}
          >
            <ScanIcon width={16} height={16} />
            {isScanning ? 'Stop Scanning' : 'Start Scanning'}
          </ScanButton>

          {isScanning && (
            <ScannerWrapper>
              <Scanner
                onScan={handleScan}
                onError={handleScanError}
                constraints={{ facingMode: 'environment' }}
                videoStyle={{ width: '100%' }}
              />
            </ScannerWrapper>
          )}

          {verifying && <StatusMsg>Verifying…</StatusMsg>}
          {error && <ErrorMsg>{error}</ErrorMsg>}
        </>
      )}

      {result && (
        <ResultCard $success>
          <ResultIcon><CheckIcon width={40} height={40} /></ResultIcon>
          <ResultTitle>Reward Redeemed!</ResultTitle>
          {result.customerName && <Detail><strong>Customer:</strong> {result.customerName}</Detail>}
          {result.rewardValue   && <Detail><strong>Reward:</strong>   {result.rewardValue}</Detail>}
          {result.rewardType    && !result.rewardValue && <Detail><strong>Type:</strong> {result.rewardType}</Detail>}
          <DoneButton onClick={reset}>Scan Another</DoneButton>
        </ResultCard>
      )}
    </FormCard>
  );
};

export default VerifyClaim;


const FormCard = styled.div`
  background: rgba(255,255,255,0.55);
  padding: 2rem;
  border-radius: 0;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(26,26,26,0.1);
  width: 100%;
  max-width: 600px;
  margin: 0 auto 2rem auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PanelTitle = styled.h2`
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.6rem;
  color: ${INK};
`;

const ScanButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0;
  border: none;
  background: ${({ $active }) => $active ? 'transparent' : RED};
  color: ${({ $active }) => $active ? RED : '#fff'};
  ${({ $active }) => $active && `border: 1px solid ${RED};`}
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 1.2rem;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: ${({ $active }) => $active ? 'rgba(196,30,58,0.08)' : '#a8172f'};
  }
`;

const ScannerWrapper = styled.div`
  width: 100%;
  max-width: 400px;
  border-radius: 0;
  overflow: hidden;
  border: 1px solid rgba(26,26,26,0.15);
`;

const StatusMsg = styled.p`
  font-family: 'Montserrat', sans-serif;
  margin-top: 1rem;
  color: ${RED};
  font-weight: 600;
  font-size: 0.95rem;
`;

const ErrorMsg = styled.p`
  font-family: 'Montserrat', sans-serif;
  margin-top: 0.75rem;
  color: ${RED};
  font-weight: 600;
  font-size: 0.9rem;
  text-align: center;
`;

const ResultCard = styled.div`
  text-align: center;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.4);
  border-radius: 0;
  padding: 2rem 1.5rem;
  width: 100%;
  max-width: 360px;
`;

const ResultIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #22c55e;
  margin-bottom: 0.5rem;
`;

const ResultTitle = styled.h3`
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #22c55e;
  font-size: 1.4rem;
  margin-bottom: 1rem;
`;

const Detail = styled.p`
  font-family: 'Montserrat', sans-serif;
  color: ${INK};
  font-size: 0.95rem;
  margin-bottom: 0.4rem;
`;

const DoneButton = styled.button`
  margin-top: 1.2rem;
  padding: 0.6rem 1.4rem;
  border-radius: 0;
  border: none;
  background: ${RED};
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: #a8172f; }
`;
