import React from 'react';
import styled from 'styled-components';
import QRCode from 'react-qr-code';
import logo from '../assets/logo.png';

// level="H" (30% error-correction) is required so the logo can cover part of
// the code without breaking scans — matches the app's ecl="H" treatment.
export default function QRCodeWithLogo({
  value,
  size = 140,
  bgColor = '#ffffff',
  fgColor = '#1a1a1a',
  logoSize,
  logoMargin = 4,
  logoBorderRadius = 8,
}) {
  const resolvedLogoSize = logoSize ?? Math.round(size * 0.22);
  return (
    <Wrap>
      <QRCode value={value} size={size} bgColor={bgColor} fgColor={fgColor} level="H" />
      <Logo $size={resolvedLogoSize} $margin={logoMargin} $radius={logoBorderRadius}>
        <img src={logo} alt="" />
      </Logo>
    </Wrap>
  );
}

const Wrap = styled.div`
  position: relative;
  display: inline-block;
  line-height: 0;
`;

const Logo = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: ${(p) => p.$size}px;
  height: ${(p) => p.$size}px;
  padding: ${(p) => p.$margin}px;
  background: #ffffff;
  border-radius: ${(p) => p.$radius}px;
  box-sizing: content-box;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;
