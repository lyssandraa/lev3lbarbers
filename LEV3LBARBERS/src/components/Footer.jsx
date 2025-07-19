import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { FaFacebookF, FaTiktok, FaInstagram } from "react-icons/fa";
import privacyPolicyText from "../common/privacyPolicy";

const Footer = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <StyledFooter>
        <FooterContent>
          <FooterLeft>
            <Brand>
              LEV<span style={{ color: "black" }}>3</span>
              <FlipL>L</FlipL> BARBERS
            </Brand>
            <NavLinks>
              <li><Link to="/shop">SHOP</Link></li>
              <li><Link to="/contact#info">CONTACT US</Link></li>
              <li onClick={() => setShowModal(true)}>PRIVACY POLICY</li>
            </NavLinks>
          </FooterLeft>

          <FooterRight>
            <JoinTitle>JOIN THE LEVEL</JoinTitle>
            <SocialIcons>
              <a href="https://www.facebook.com/people/Lev3l-barbers/61565542892469/" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
              <a href="https://www.instagram.com/lev3l_barbers/" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
              <a href="https://www.tiktok.com/@lev3lbarbers" target="_blank" rel="noopener noreferrer"><FaTiktok /></a>
            </SocialIcons>
          </FooterRight>
        </FooterContent>
      </StyledFooter>

      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => setShowModal(false)}>×</CloseButton>
            <ModalText>
              {privacyPolicyText.split("\n\n").map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </ModalText>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default Footer;

// Styled Components
const StyledFooter = styled.footer`
  width: 100%;
  height: 150px;
  background: linear-gradient(to bottom, #1f1f1f 70%, #151515 100%);
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  display: flex;
  justify-content: center;
  align-items: stretch;
  padding: 0 20px;
  box-sizing: border-box;
`;

const FooterContent = styled.div`
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-sizing: border-box;
`;

const FooterLeft = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 1.4rem;
  line-height: 1.3;
`;

const Brand = styled.div`
  font-size: 2rem;
  color: #990000;
  cursor: pointer;
  text-shadow:
    -1px -1px 0 #E6E6ED,
    1px -1px 0 #E6E6ED,
    -1px  1px 0 #E6E6ED,
    1px  1px 0 #E6E6ED;
  margin-bottom: 10px;
`;

const FlipL = styled.span`
  display: inline-block;
  transform: scaleX(-1);
`;

const NavLinks = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem 1rem;

  li {
    cursor: pointer;
    font-size: 1rem;
    color: white;
    transition: color 0.3s ease;

    &:hover {
      color: #1d2b53;
      transform: scale(1.1);
    }

    a {
      color: inherit;
      text-decoration: none;
    }
  }
`;

const FooterRight = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  flex: 1;
  position: relative;
`;

const JoinTitle = styled.div`
  font-size: 1.1rem;
  letter-spacing: 1px;
  font-weight: 500;
  color: #ccc;
  margin-bottom: 6px;
  text-transform: uppercase;
`;

const SocialIcons = styled.div`
  display: flex;
  gap: 15px;
  font-size: 1.4rem;

  a {
    color: #fff;
    display: inline-flex;
    align-items: center;
    transition: color 0.2s ease-in-out, transform 0.2s ease;

    &:hover {
      color: #ff6600;
      transform: scale(1.2);
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  background: #222;
  padding: 25px 20px;
  border-radius: 10px;
  max-width: 480px;
  width: 90%;
  max-height: 70vh;
  overflow-y: auto;
  color: white;
  font-size: 0.95rem;
  line-height: 1.5;
  position: relative;
  box-shadow: 0 0 15px rgba(0,0,0,0.5);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 14px;
  background: transparent;
  color: white;
  font-size: 1.8rem;
  border: none;
  cursor: pointer;
  line-height: 1;
`;

const ModalText = styled.div`
  p {
    margin-bottom: 1rem;
  }

  a {
    color: #4fa3ff;
    text-decoration: underline;
  }
`;
