import React from "react";
import styled from "styled-components";
import { FaFacebookF, FaTiktok, FaInstagram } from "react-icons/fa";

const Footer = () => {
    return (
        <StyledFooter> 
            <FooterContent>
            <FooterLeft>
                <div>LEV3<span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>L</span> BARBERS</div>
                <ul>
                    <li>SHOP</li>
                    <li>CONTACT US</li>
                    <li>PRIVACY POLICY</li>
                </ul>
            </FooterLeft>

            <FooterRight>
                <div>Social Media</div>
                <IconRow>
                    <a href="https://www.facebook.com/people/Lev3l-barbers/61565542892469/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebookF /></a>
                    <a href="https://www.instagram.com/lev3l_barbers/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
                    <a href="https://www.tiktok.com/@lev3lbarbers" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><FaTiktok /></a>
                </IconRow>
            </FooterRight>
            </FooterContent>
        </StyledFooter>
    )
}

export default Footer;

const StyledFooter = styled.footer`
    width: 100%;
    height: 80px;
    background-color: #000;
    color: #ffff;
    width: 100%;
    font-family: 'Bebas Neue', sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 30px;
    box-sizing: border-box;
    overflow: hidden;
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
    font-size: 1.4rem;
    line-height: 1.3;

    div{
    font-size: 2rem;
    margin: 0;
    padding: 0;
    cursor: pointer;
    }

    ul {
    display: grid;
    grid-template-columns: repeat(3, auto);
    gap: 0.5rem 1rem;
    padding: 0;
    margin: 0;
    }

    li {
    text-align: left;
    list-style: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    font-size: 1rem;
    }
`;

const FooterRight = styled.div`
    display: flex;
    flex-direction: column;
    font-size: 1.5rem;
    align-items: flex-end;
`;

const IconRow = styled.div`
    display: flex;
    gap: 15px;
    margin-top: 0.3rem;
    font-size: 1.4rem;
    cursor: pointer;

    a {
    color: #fff;   
    display: inline-flex; 
    align-items: center;
    transition: color 0.2s ease-in-out;

    &:hover {
      color: #ff6600; 
    }
  }

`;