import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { FaFacebookF, FaTiktok, FaInstagram } from "react-icons/fa";

const Footer = () => {
    return (
        <StyledFooter> 
            <FooterContent>
                <FooterLeft>
                    <div>LEV<span style={{ color: 'black' }}>3</span><span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>L</span> BARBERS</div>
                    <ul>
                        <li><Link to="/shop">SHOP</Link></li>
                        <li><Link to="/contact">CONTACT US</Link></li>
                        <li><Link to="/privacy-policy">PRIVACY POLICY</Link></li>
                    </ul>
                </FooterLeft>

                <FooterRight>
                    <BottomRight>
                        <JoinTitle>JOIN THE LEVEL</JoinTitle>
                        <IconRow>
                            <a href="https://www.facebook.com/people/Lev3l-barbers/61565542892469/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebookF /></a>
                            <a href="https://www.instagram.com/lev3l_barbers/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
                            <a href="https://www.tiktok.com/@lev3lbarbers" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><FaTiktok /></a>
                        </IconRow>
                    </BottomRight>
                </FooterRight>
            </FooterContent>
        </StyledFooter>
    );
};

export default Footer;

// Styles

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
    overflow: hidden;
`;

const FooterContent = styled.div`
    width: 100%;
    max-width: 1200px;
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    padding: 0 20px;
    box-sizing: border-box;
`;

const FooterLeft = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: 1.4rem;
    line-height: 1.3;

    div {
        font-size: 2rem;
        margin: 0;
        padding: 0;
        cursor: pointer;
        color: #990000;
        text-shadow:
            -1px -1px 0 #E6E6ED,
            1px -1px 0 #E6E6ED,
            -1px  1px 0 #E6E6ED,
            1px  1px 0 #E6E6ED;
    }

    ul {
        display: grid;
        grid-template-columns: repeat(1, auto);
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

        a {
    color: white;
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: #1d2b53;
    }
  }

        &:hover {
            transform: scale(1.1);
        }
    }
`;

const FooterRight = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;
    flex: 1;
    position: relative;
`;

const BottomRight = styled.div`
    position: absolute;
    bottom: 10px;
    right: 0;
    text-align: right;
`;

const JoinTitle = styled.div`
    font-size: 1.1rem;
    letter-spacing: 1px;
    font-weight: 500;
    color: #ccc;
    margin-bottom: 6px;
    text-transform: uppercase;
`;

const IconRow = styled.div`
    display: flex;
    gap: 15px;
    font-size: 1.4rem;
    cursor: pointer;

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
