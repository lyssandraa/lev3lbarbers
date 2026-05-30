import React, { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../utils/api";

const ServiceMenu = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoggedIn(!!token); 

    const getServices = async () => {
      setLoading(true);

      try {
        if (token) {
          try {
            const res = await api.get("/services/all-services");
            setServices(res.data.allServices || []);
            return;
          } catch (err) {
            if (
              !err.response ||
              (err.response.status !== 401 && err.response.status !== 403)
            ) {
              throw err;
            }
          }
        }

        // public fallback
        const res = await api.get("/services/public-services");
        setServices(res.data.services || []);
      } catch (err) {
        console.error("Failed to fetch services:", err);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    getServices();
  }, []);

  return (
    <SectionWrapper>
      <MenuTitle>Our Services</MenuTitle>
      {loading ? (
        <h5>Loading services...</h5>
      ) : services.length === 0 ? (
        <h5>We Will Share Our Fantastic Services Soon. Stay Tuned!</h5>
      ) : (
        <MenuCard>
          <ServiceList>
            {services.map((service) => (
              <ServiceItem key={service.id} $loggedIn={loggedIn}>
              <p>{service.name}</p>
              {loggedIn && <p>{service.price && `£${service.price}`}</p>}
            </ServiceItem>
            
            ))}
          </ServiceList>

          <ExtraInfo>
            We cater to <strong>all hair types</strong>, including{" "}
            <strong>afro, curly, straight</strong>, and more.
            <br />
            Other services may also be available <strong>upon request</strong>
          </ExtraInfo>

          {!loggedIn && (
            <SignupPromo>
              💈 Want <strong>special prices</strong> and{' '}
              <strong>exclusive offers</strong>?  
              <br /> 
              <a href="/register">Sign up today</a> - it only takes a minute!
            </SignupPromo>
          )}
        </MenuCard>
      )}
    </SectionWrapper>
  );
};

export default ServiceMenu;


const SectionWrapper = styled.section`
  font-family: "Bebas Neue", sans-serif;
  min-height: 90vh;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;

  h5 {
    font-size: 1.5rem;
    font-weight: bold;
    display: flex;
    text-align: center;
    color: #f5f2ed;
    border: 1px solid rgba(200, 168, 96, 0.3);
    border-radius: 10px;
    padding: 10px 15px;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(6px);
  }

  @media (max-width: 768px) {
    min-height: 100vh;
  }
`;

const MenuTitle = styled.h2`
  font-size: 2.5rem;
  text-align: center;
  letter-spacing: 1px;
  margin-bottom: 20px;
  margin-top: 40px;
  color: #f5f2ed;
  text-shadow: 0 2px 12px rgba(0,0,0,0.6);
`;

const MenuCard = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  padding: 1px 30px;
  max-width: 600px;
  width: 100%;
  color: #f5f2ed;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
`;

const ServiceList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ServiceItem = styled.li`
  display: flex;
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-direction: row;
  justify-content: ${({ $loggedIn }) =>
    $loggedIn ? "space-between" : "center"};
  align-items: center;
  width: 100%;

  p {
    color: #f5f2ed;
  }
`;

const ExtraInfo = styled.p`
  margin-top: 20px;
  font-size: 1.3rem;
  font-weight: 700;
  text-align: center;
  color: rgba(245, 242, 237, 0.8);
  line-height: 1.6;

  strong {
    color: #c8a860;
    font-weight: 500;
  }
`;

const SignupPromo = styled.div`
  margin: 20px 0;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
  color: #c8a860;
  padding: 15px;
  border: 1px dashed rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  background: rgba(200, 168, 96, 0.06);

  a {
    color: #c8a860;
    font-weight: 900;
    text-decoration: underline;
    margin-left: 5px;
    transition: color 0.2s;

    &:hover {
      color: #f5f2ed;
    }
  }
`;
