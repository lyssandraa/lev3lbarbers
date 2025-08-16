import React from "react";
import styled from "styled-components";
import background from '../assets/adminImg.png';

const ContactPage = () => {
  return (
    <PageWrapper>
      <Section id="location" style={{ scrollMarginTop: '90px' }}>
        <GradientTitle>Our Location</GradientTitle>
        <Address>
         76 Eastbank Street,<br />
        <strong>Soutport, UK</strong><br />
        PR8 1EF
        </Address>
        <MapWrapper>
          <iframe
            title="Barber Shop Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.179804219527!2d-3.0026584655850725!3d53.64376606025772!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487b3f28c2404633%3A0x865d00ff707467f9!2sLev3l%20barbers!5e0!3m2!1sen!2suk!4v1752950880062!5m2!1sen!2suk"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </MapWrapper>
      </Section>

        <Divider/>

      <Section id="info" style={{ scrollMarginTop: '90px' }}>
        <GradientTitle>Contact Info</GradientTitle>
        <ContactInfo>
          <p><strong>Phone:</strong> <a href="tel:+441234567890">+44 7538 420684</a></p>
          <p><strong>Email:</strong> <a href="mailto:lev3lbarbers@gmail.com">lev3lbarbers@gmail.com</a></p>
          <p><strong>Social Media:</strong> LEV3L BARBERS </p>
        </ContactInfo>
      </Section>

      <Divider/>

      <Section id="hours" style={{ scrollMarginTop: '90px' }}>
        <GradientTitle>Opening Hours</GradientTitle>
        <OpeningHours>
          <li><strong>Mon-Thu:</strong> 9:00 AM - 6:00 PM</li>
          <li><strong>Fri-Sat:</strong> 9:00 AM - 7:00 PM</li>
          <li><strong>Sun:</strong> 10:00 AM - 4:00 PM</li>
        </OpeningHours>
      </Section>
    </PageWrapper>
  );
};

export default ContactPage;

const PageWrapper = styled.div`
  background-image: url(${background});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #efefef;
  font-family: 'Bebas Neue', sans-serif;
`;

const Section = styled.section`
  max-width: 700px;
  width: 100%;
  margin-bottom: 60px;
  padding: 20px;
`;

const GradientTitle = styled.h2`
  font-size: 3rem;
  text-align: center;
  margin-bottom: 25px;
  background: linear-gradient(
    10deg,
    #a07400 0%,
    #c89300 20%,
    #ffd700 40%,
    #fff8c0 50%,
    #ffcc00 60%,
    #c89300 80%,
    #a07400 100%
  );
  background-size: 200%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
`;

const Address = styled.address`
  font-style: normal;
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 35px;
  line-height: 1.6;

  strong {
    color: #c99a32;
  }
`;

const MapWrapper = styled.div`
  width: 100%;
  height: 300px;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 0 15px rgba(201, 154, 50, 0.15);
  margin-bottom: 40px;

  iframe {
    width: 100%;
    height: 100%;
    border: 0;
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 2px;
  background: #c99a32;
  margin: 60px 0;
  box-shadow: 0 0 10px rgba(201, 154, 50, 0.15);
  border-radius: 1px;

  @media (max-width: 768px){
  max-width: 700px;
  margin: 30px 0;
  }
`;

const ContactInfo = styled.div`
  font-size: 1.5rem;
  text-align: center;

  a {
    color: #efefef;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  p {
    margin: 10px 0;

    strong {
      color: #c99a32;
    }
  }
`;


const OpeningHours = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.5rem;

  li {
    margin-bottom: 8px;
    text-align: center;

    strong {
      color: #c99a32;
    }
  }
`;
