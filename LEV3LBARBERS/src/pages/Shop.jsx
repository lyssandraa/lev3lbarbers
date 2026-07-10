import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import styled, { keyframes, css } from 'styled-components';
import Seo from '../common/Seo';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { GiftIcon, PencilIcon } from '../common/icons';

import { BACKEND } from '../config';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const EASE  = [0.22, 1, 0.36, 1];

const Shop = () => {
  const [products,     setProducts]     = useState([]);
  const [denominations,setDenominations]= useState([]);
  const [loading,      setLoading]      = useState(true);
  const [lightbox,     setLightbox]     = useState(null);
  const [addedId,      setAddedId]      = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [tab,           setTab]          = useState('online');
  const [flyItem,       setFlyItem]      = useState(null);
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  const { addItem } = useCart();

  useEffect(() => {
    Promise.all([
      api.get('/shop-products/public'),
      api.get('/gift-cards/denominations'),
    ])
      .then(([prodRes, gcRes]) => {
        setProducts(prodRes.data.products || []);
        setDenominations(gcRes.data.denominations || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isOutOfStock = (p) => p.trackStock && p.stock !== null && p.stock !== undefined && p.stock <= 0;
  const isLowStock  = (p) => p.trackStock && p.stock !== null && p.stock !== undefined && p.stock > 0 && p.stock <= 5;

  /* Small ghost token flies from the clicked button to the header cart icon */
  const flyToCart = (fromEl, imgUrl, kind) => {
    const cartIcon = document.getElementById('cart-icon');
    if (!fromEl || !cartIcon) return;
    const from = fromEl.getBoundingClientRect();
    const to   = cartIcon.getBoundingClientRect();
    setFlyItem({
      id: Date.now(),
      imgUrl, kind,
      fromX: from.left + from.width / 2 - 16,
      fromY: from.top + from.height / 2 - 16,
      toX:   to.left + to.width / 2 - 16,
      toY:   to.top + to.height / 2 - 16,
    });
  };

  const handleAddToCart = (product, fromEl) => {
    if (isOutOfStock(product)) return;
    addItem({
      type:      'product',
      productId: product.id,
      name:      product.name,
      price:     product.price,
      imageUrl:  product.imageUrl || null,
    });
    flyToCart(fromEl, product.imageUrl, 'product');
  };

  const handleAddGiftCard = (denom, fromEl) => {
    addItem({
      type:          'gift-card',
      productId:     null,
      name:          `Gift Card`,
      price:         denom.value,
      giftCardValue: denom.value,
      imageUrl:      null,
    });
    setAddedId(`gc-${denom.id}`);
    flyToCart(fromEl, null, 'gift');
    setTimeout(() => setAddedId(null), 1400);
  };

  const handleAddCustomGiftCard = (fromEl) => {
    const val = parseFloat(customAmount);
    if (!val || val < 1) return;
    addItem({
      type:          'gift-card',
      productId:     null,
      name:          `Gift Card`,
      price:         val,
      giftCardValue: val,
      imageUrl:      null,
    });
    setAddedId('gc-custom');
    setCustomAmount('');
    flyToCart(fromEl, null, 'gift');
    setTimeout(() => setAddedId(null), 1400);
  };

  const online  = products.filter(p => p.category === 'online');
  const inShop  = products.filter(p => p.category === 'in-shop');
  const isEmpty = online.length === 0 && inShop.length === 0 && denominations.length === 0;
  const showTabs = online.length > 0 && inShop.length > 0;
  const activeList = !showTabs ? (online.length > 0 ? online : inShop) : (tab === 'online' ? online : inShop);

  return (
    <Wrap>
      <Seo title="Shop" description="Shop LEV3L Barbers products, merch, and gift cards." />
      <Hero
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <Eyebrow>LEV3L Barbers</Eyebrow>
        <Title>The Shop</Title>
        <Rule />
      </Hero>

      {loading ? (
        <LoadingGrid>
          {[0, 1, 2, 3].map(i => (
            <SkeletonCard key={i} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </LoadingGrid>
      ) : isEmpty ? (
        <ComingSoon
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <ComingIcon>✦</ComingIcon>
          <ComingTitle>Exciting things coming soon.</ComingTitle>
          <ComingSub>Our shop is being stocked. Check back soon for exclusive LEV3L products &amp; merch.</ComingSub>

          <Lines aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => <Line key={i} $i={i} />)}
          </Lines>
        </ComingSoon>
      ) : (
        <Sections>
          {(online.length > 0 || inShop.length > 0) && (
            <Section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              {showTabs ? (
                <TabRow>
                  <TabBtn $active={tab === 'online'} onClick={() => setTab('online')}>
                    Online
                    {tab === 'online' && <TabUnderline layoutId="shopTab" />}
                  </TabBtn>
                  <TabBtn $active={tab === 'in-shop'} onClick={() => setTab('in-shop')}>
                    In Shop
                    {tab === 'in-shop' && <TabUnderline layoutId="shopTab" />}
                  </TabBtn>
                </TabRow>
              ) : (
                <SectionHead>
                  <SectionTitle>{online.length > 0 ? 'Online' : 'In Shop'}</SectionTitle>
                  <SectionSub>{online.length > 0 ? 'Order from anywhere' : 'Available at the chair'}</SectionSub>
                </SectionHead>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={showTabs ? tab : 'single'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <Grid>
                    {activeList.map((p, i) => (
                      <ProductCard
                        key={p.id} product={p} index={i} isLoggedIn={isLoggedIn}
                        onExpand={setLightbox}
                        onAddToCart={
                          p.category === 'online' && p.price != null && !isOutOfStock(p)
                            ? (el) => handleAddToCart(p, el)
                            : null
                        }
                        outOfStock={isOutOfStock(p)}
                        lowStock={isLowStock(p)}
                        stockCount={p.trackStock ? p.stock : null}
                      />
                    ))}
                  </Grid>
                </motion.div>
              </AnimatePresence>
            </Section>
          )}

          {denominations.length > 0 && (
            <Section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
            >
              <SectionHead>
                <SectionTitle>Gift Cards</SectionTitle>
                <SectionSub>Give the gift of a fresh cut</SectionSub>
              </SectionHead>
              <GiftCardGrid>
                {/* Custom amount tile */}
                <GiftCardTile
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  style={{ transformPerspective: 800 }}
                >
                  <GiftIconWrap><PencilIcon width={26} height={26} /></GiftIconWrap>
                  <GiftValue style={{ fontSize: '1.2rem', letterSpacing: 1 }}>Custom</GiftValue>
                  <GiftSub>Choose your own amount</GiftSub>
                  <CustomAmountRow>
                    <CustomInput
                      type="number" min="1" step="1"
                      placeholder="£ Amount"
                      value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddCustomGiftCard(e.target)}
                    />
                  </CustomAmountRow>
                  <AddToCartBtn
                    $added={addedId === 'gc-custom'}
                    $wide
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => handleAddCustomGiftCard(e.currentTarget)}
                    disabled={!customAmount || parseFloat(customAmount) < 1}
                  >
                    {addedId === 'gc-custom' ? '✓ Added' : '+ Add to Cart'}
                  </AddToCartBtn>
                </GiftCardTile>

                {denominations.map((d, i) => (
                  <GiftCardTile
                    key={d.id}
                    initial={{ opacity: 0, rotateY: -90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.07, ease: EASE }}
                    style={{ transformPerspective: 800 }}
                  >
                    <GiftIconWrap><GiftIcon width={30} height={30} /></GiftIconWrap>
                    <GiftValue><CountUp value={d.value} /></GiftValue>
                    {d.label && <GiftLabel>{d.label}</GiftLabel>}
                    <GiftSub>Digital gift card — code emailed instantly</GiftSub>
                    <AddToCartBtn
                      $added={addedId === `gc-${d.id}`}
                      $wide
                      whileTap={{ scale: 0.97 }}
                      onClick={(e) => handleAddGiftCard(d, e.currentTarget)}
                    >
                      {addedId === `gc-${d.id}` ? '✓ Added' : '+ Add to Cart'}
                    </AddToCartBtn>
                  </GiftCardTile>
                ))}
              </GiftCardGrid>
            </Section>
          )}
        </Sections>
      )}

      {/* Fly-to-cart ghost token */}
      <AnimatePresence>
        {flyItem && (
          <FlyGhost
            key={flyItem.id}
            initial={{ x: flyItem.fromX, y: flyItem.fromY, scale: 1, opacity: 1 }}
            animate={{ x: flyItem.toX, y: flyItem.toY, scale: 0.3, opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={() => {
              setFlyItem(null);
              window.dispatchEvent(new CustomEvent('cart-bump'));
            }}
          >
            {flyItem.imgUrl
              ? <img src={`${BACKEND}${flyItem.imgUrl}`} alt="" />
              : flyItem.kind === 'gift'
                ? <GiftIcon width={16} height={16} style={{ color: RED }} />
                : <span>✦</span>}
          </FlyGhost>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightbox && (
          <LightboxBackdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <LightboxInner
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
              onClick={e => e.stopPropagation()}
            >
              {lightbox.imageUrl && (
                <LightboxImgWrap>
                  <LightboxImg
                    src={`${BACKEND}${lightbox.imageUrl}`}
                    alt={lightbox.name}
                    initial={{ clipPath: 'inset(100% 0 0 0)' }}
                    animate={{ clipPath: 'inset(0% 0 0 0)' }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
                  />
                </LightboxImgWrap>
              )}
              <LightboxBody>
                <LightboxName>{lightbox.name}</LightboxName>
                {lightbox.description && <LightboxDesc>{lightbox.description}</LightboxDesc>}
                <LightboxPrice>
                  <PriceDisplay product={lightbox} isLoggedIn={isLoggedIn} large />
                </LightboxPrice>
              </LightboxBody>
              <CloseBtn onClick={() => setLightbox(null)}>✕</CloseBtn>
            </LightboxInner>
          </LightboxBackdrop>
        )}
      </AnimatePresence>
    </Wrap>
  );
};

/* ─── Product card sub-component ─── */

const ProductCard = ({ product, index, isLoggedIn, onExpand, onAddToCart, outOfStock, lowStock, stockCount }) => {
  const [hovered, setHovered] = useState(false);
  const { items, setQty } = useCart();
  const cartItem = items.find(i => i.cartId === `product-${product.id}`);
  const qty = cartItem?.quantity || 0;
  const numStr = String(index + 1).padStart(2, '0');

  const rawX    = useMotionValue(0);
  const rawY    = useMotionValue(0);
  const sp      = { stiffness: 300, damping: 28, mass: 0.6 };
  const spX     = useSpring(rawX, sp);
  const spY     = useSpring(rawY, sp);
  const rotateX = useTransform(spY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(spX, [-0.5, 0.5], [-5, 5]);

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - r.left) / r.width  - 0.5);
    rawY.set((e.clientY - r.top)  / r.height - 0.5);
  };
  const onMouseLeave = () => { setHovered(false); rawX.set(0); rawY.set(0); };

  return (
    <Card
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: EASE }}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
    >
      <ImgWrap onClick={() => onExpand(product)}>
        {product.imageUrl ? (
          <img src={`${BACKEND}${product.imageUrl}`} alt={product.name} />
        ) : (
          <ImgPlaceholder>✦</ImgPlaceholder>
        )}
        <AnimatePresence>
          {hovered && (
            <StripeOverlay
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.45, ease: EASE }}
            />
          )}
        </AnimatePresence>
        <CardOverlay className="overlay">
          <OverlayText>View</OverlayText>
        </CardOverlay>
      </ImgWrap>
      <CardBody>
        <GhostNum>{numStr}</GhostNum>
        <CardName>{product.name}</CardName>
        {product.description && <CardDesc>{product.description}</CardDesc>}
        {outOfStock && <StockBadge $out>Out of stock</StockBadge>}
        {lowStock && !outOfStock && <StockBadge>Only {stockCount} left</StockBadge>}
        <CardFooter>
          <CardPrice>
            <PriceDisplay product={product} isLoggedIn={isLoggedIn} />
          </CardPrice>
          {outOfStock ? (
            <AddToCartBtn $disabled disabled>Out of stock</AddToCartBtn>
          ) : onAddToCart && (isLoggedIn || !product.priceHidden) && (
            qty > 0 ? (
              <QtyStepper>
                <QtyStepBtn whileTap={{ scale: 0.82 }} onClick={() => setQty(cartItem.cartId, qty - 1)}>−</QtyStepBtn>
                <QtyStepNum>{qty}</QtyStepNum>
                <QtyStepBtn whileTap={{ scale: 0.82 }} onClick={() => setQty(cartItem.cartId, qty + 1)}>+</QtyStepBtn>
              </QtyStepper>
            ) : (
              <AddToCartBtn whileTap={{ scale: 0.92 }} onClick={(e) => onAddToCart(e.currentTarget)}>+</AddToCartBtn>
            )
          )}
        </CardFooter>
      </CardBody>
    </Card>
  );
};

/* ─── Price display logic ─── */

const PriceDisplay = ({ product, isLoggedIn, large }) => {
  if (product.price === null || product.price === undefined) return null;

  if (product.priceHidden && !isLoggedIn) {
    return <MembersOnly $large={large}>Members only</MembersOnly>;
  }

  return (
    <PriceTag $large={large}>
      <CountUp value={Number(product.price)} />
    </PriceTag>
  );
};

/* ─── Price count-up, triggers once on scroll into view ─── */

const CountUp = ({ value, duration = 1200 }) => {
  const [val, setVal] = useState(0);
  const ref    = useRef(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!value) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !hasRun.current) {
        hasRun.current = true;
        const steps = 32;
        let step = 0;
        const timer = setInterval(() => {
          step++;
          setVal((value * step) / steps);
          if (step >= steps) clearInterval(timer);
        }, duration / steps);
      }
    }, { threshold: 0.6 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value, duration]);

  return <span ref={ref}>£{val.toFixed(2)}</span>;
};

export default Shop;

/* ─────────── Keyframes ─────────── */

const drift = keyframes`
  from { transform: translateY(0); }
  to   { transform: translateY(-100%); }
`;

/* ─────────── Layout ─────────── */

const Wrap = styled.div`
  min-height: 92vh;
  background: ${CREAM};
  color: ${INK};
  font-family: 'Bebas Neue', sans-serif;
  padding-bottom: 6rem;
`;

const Hero = styled(motion.div)`
  text-align: center;
  padding: 4.5rem 5% 2.5rem;
`;

const Eyebrow = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 10px; font-weight: 900;
  letter-spacing: 5px;
  text-transform: uppercase;
  color: ${RED};
  margin: 0 0 0.6rem;
`;

const Title = styled.h1`
  font-size: clamp(3.5rem, 10vw, 7rem);
  letter-spacing: 5px;
  margin: 0;
  color: ${INK};
  line-height: 1;
`;

const Rule = styled.div`
  width: 52px;
  height: 2px;
  background: ${RED};
  margin: 1.4rem auto 0;
`;

/* ─── Sections ─── */

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4rem;
  padding: 3rem 5% 0;
  max-width: 1300px;
  margin: 0 auto;
`;

const Section = styled(motion.div)``;

const SectionHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(26, 26, 26, 0.1);
  padding-bottom: 0.75rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.6rem;
  letter-spacing: 4px;
  margin: 0;
  color: ${INK};
`;

const SectionSub = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 2px;
  color: rgba(26, 26, 26, 0.5);
  text-transform: uppercase;
`;

/* ─── Tabs ─── */

const TabRow = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1.8rem;
  border-bottom: 1px solid rgba(26, 26, 26, 0.1);
`;

const TabBtn = styled.button`
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 0 0.8rem;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.1rem;
  letter-spacing: 3px;
  color: ${({ $active }) => $active ? INK : 'rgba(26, 26, 26, 0.4)'};
  transition: color 0.2s;
  &:hover { color: ${INK}; }
`;

const TabUnderline = styled(motion.div)`
  position: absolute;
  left: 0; right: 0; bottom: -1px;
  height: 2px;
  background: ${RED};
`;

/* ─── Product grid ─── */

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;

  @media (max-width: 500px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
`;

const Card = styled(motion.div)`
  background: transparent;
  overflow: hidden;
  border: 1px solid rgba(26, 26, 26, 0.1);
  cursor: pointer;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    border-color: rgba(26, 26, 26, 0.25);
    box-shadow: 0 16px 40px rgba(26, 26, 26, 0.14);
  }

  &:hover .overlay { opacity: 1; }
  &:hover img { transform: scale(1.04); }
`;

const ImgWrap = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: rgba(26, 26, 26, 0.03);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }
`;

const StripeOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: repeating-linear-gradient(
    -48deg,
    ${RED}      0px,
    ${RED}      5px,
    transparent 5px,
    transparent 16px
  );
  opacity: 0.05;
`;

const ImgPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: rgba(26, 26, 26, 0.2);
`;

const CardOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(26, 26, 26, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
`;

const OverlayText = styled.span`
  font-size: 1rem;
  letter-spacing: 3px;
  color: ${CREAM};
`;

const CardBody = styled.div`
  padding: 0.85rem 1rem 0.95rem;
  position: relative;
  overflow: hidden;
  z-index: 2;
`;

/* Faint corner stamp number, sits behind the text */
const GhostNum = styled.span`
  position: absolute;
  top: -0.25em;
  right: 0.1em;
  z-index: -1;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2.6rem;
  color: rgba(196, 30, 58, 0.07);
  line-height: 1;
  pointer-events: none;
  user-select: none;
`;

const CardName = styled.h3`
  font-size: 1rem;
  letter-spacing: 1.5px;
  margin: 0 0 0.25rem;
  color: ${INK};
`;

const CardDesc = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem;
  font-weight: 500;
  color: rgba(26, 26, 26, 0.75);
  margin: 0 0 0.5rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardFooter = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-top: 0.4rem;
`;

const CardPrice = styled.div``;

const PriceTag = styled.span`
  font-size: ${({ $large }) => $large ? '1.6rem' : '1rem'};
  letter-spacing: 1px;
  color: ${INK};
`;

const MembersOnly = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: ${({ $large }) => $large ? '0.78rem' : '0.66rem'};
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: ${RED};
  border: 1px solid rgba(196, 30, 58, 0.35);
  padding: ${({ $large }) => $large ? '4px 10px' : '2px 7px'};
`;

/* ─── Stamped stock badge ─── */

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 rgba(196, 30, 58, 0); }
  50%      { box-shadow: 0 0 8px rgba(196, 30, 58, 0.5); }
`;

const StockBadge = styled.span`
  display: inline-block;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.72rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 2px 8px;
  border: 1.5px solid ${({ $out }) => $out ? 'rgba(26, 26, 26, 0.3)' : RED};
  color: ${({ $out }) => $out ? 'rgba(26, 26, 26, 0.45)' : RED};
  transform: rotate(-4deg);
  margin: 0 0 0.4rem;
  ${({ $out }) => !$out && css`animation: ${pulseGlow} 1.8s ease-in-out infinite;`}
`;

/* ─── Loading skeletons ─── */

const LoadingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
  padding: 3rem 5% 0;
  max-width: 1300px;
  margin: 0 auto;
`;

const SkeletonCard = styled.div`
  border-radius: 4px;
  aspect-ratio: 3 / 4;
  background: linear-gradient(90deg, rgba(26,26,26,0.06) 25%, rgba(26,26,26,0.1) 50%, rgba(26,26,26,0.06) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;

  @keyframes shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }
`;

/* ─── Coming soon ─── */

const ComingSoon = styled(motion.div)`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 55vh;
  padding: 4rem 6%;
  text-align: center;
  overflow: hidden;
`;

const ComingIcon = styled.div`
  font-size: 2.4rem;
  color: ${RED};
  opacity: 0.5;
  margin-bottom: 1.2rem;
`;

const ComingTitle = styled.h2`
  font-size: clamp(1.8rem, 5vw, 3rem);
  letter-spacing: 3px;
  margin: 0 0 0.75rem;
  color: ${INK};
  position: relative;
  z-index: 2;
`;

const ComingSub = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.88rem;
  font-weight: 500;
  color: rgba(26, 26, 26, 0.5);
  line-height: 1.85;
  max-width: 380px;
  margin: 0;
  position: relative;
  z-index: 2;
`;

const Lines = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
`;

const Line = styled.div`
  position: absolute;
  bottom: -100%;
  width: 1px;
  height: 200%;
  background: linear-gradient(to top, transparent 0%, ${RED} 50%, transparent 100%);
  opacity: ${({ $i }) => 0.05 + ($i % 3) * 0.025};
  left: ${({ $i }) => 8 + $i * 12}%;
  animation: ${drift} ${({ $i }) => 6 + $i * 1.5}s linear infinite;
  animation-delay: ${({ $i }) => -$i * 0.8}s;
`;

/* ─── Fly-to-cart ghost ─── */

const FlyGhost = styled(motion.div)`
  position: fixed;
  top: 0; left: 0;
  width: 32px; height: 32px;
  border-radius: 50%;
  background: ${CREAM};
  border: 1.5px solid ${RED};
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
  overflow: hidden;
  z-index: 99999;
  pointer-events: none;
  box-shadow: 0 4px 14px rgba(26, 26, 26, 0.25);

  img { width: 100%; height: 100%; object-fit: cover; }
`;

/* ─── Lightbox ─── */

const LightboxBackdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 10, 0.85);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const LightboxInner = styled(motion.div)`
  position: relative;
  max-width: 480px;
  width: 100%;
  background: ${CREAM};
  overflow: hidden;
  border: 1px solid rgba(26, 26, 26, 0.1);
`;

const LightboxImgWrap = styled.div`
  width: 100%;
  max-height: 380px;
  overflow: hidden;
  background: #000;
`;

const LightboxImg = styled(motion.img)`
  width: 100%;
  max-height: 380px;
  object-fit: cover;
  display: block;
`;

const LightboxBody = styled.div`
  padding: 1.25rem 1.4rem 1.4rem;
`;

const LightboxName = styled.h2`
  font-size: 1.8rem;
  letter-spacing: 2px;
  margin: 0 0 0.4rem;
  color: ${INK};
`;

const LightboxDesc = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.88rem;
  font-weight: 500;
  color: rgba(26, 26, 26, 0.55);
  margin: 0 0 0.75rem;
  line-height: 1.6;
`;

const LightboxPrice = styled.div``;

const CloseBtn = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(26, 26, 26, 0.55);
  border: none;
  color: ${CREAM};
  font-size: 1rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 3;
  &:hover { background: rgba(26, 26, 26, 0.8); }
`;

const AddToCartBtn = styled(motion.button)`
  background: ${({ $added, $disabled }) => $disabled ? 'transparent' : $added ? 'rgba(76,175,80,0.14)' : 'rgba(196,30,58,0.08)'};
  border: 1px solid ${({ $added, $disabled }) => $disabled ? 'rgba(26,26,26,0.15)' : $added ? 'rgba(76,175,80,0.5)' : 'rgba(196,30,58,0.4)'};
  color: ${({ $added, $disabled }) => $disabled ? 'rgba(26,26,26,0.35)' : $added ? '#2e7d32' : RED};
  padding: 0.3rem 0.65rem;
  border-radius: 0; cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  font-family: 'Bebas Neue', sans-serif; font-size: 0.75rem; letter-spacing: 1.5px;
  transition: all 0.2s; white-space: nowrap; flex-shrink: 0;
  width: ${({ $wide }) => $wide ? '100%' : 'auto'};
  margin-top: ${({ $wide }) => $wide ? '0.35rem' : '0'};
  &:hover:not(:disabled) { background: ${RED}; color: #fff; border-color: ${RED}; }
`;

/* Inline qty stepper — replaces the add button once the product is in the cart */
const QtyStepper = styled.div`
  display: flex; align-items: center; gap: 0;
  border: 1px solid rgba(196, 30, 58, 0.4);
  flex-shrink: 0;
`;
const QtyStepBtn = styled(motion.button)`
  background: none; border: none; cursor: pointer;
  color: ${RED}; width: 22px; height: 22px;
  font-size: 0.85rem; line-height: 1; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
  &:hover { background: rgba(196,30,58,0.08); }
`;
const QtyStepNum = styled.span`
  font-family: 'Montserrat', sans-serif; font-size: 0.72rem; font-weight: 700;
  color: ${INK}; width: 20px; text-align: center;
`;

/* Gift card section */
const GiftCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.1rem;
  @media (max-width: 500px) { grid-template-columns: repeat(2, 1fr); }
`;

const GiftCardTile = styled(motion.div)`
  background: transparent;
  border: 1px solid rgba(26, 26, 26, 0.1);
  padding: 1.5rem 1.1rem 1.2rem;
  text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 0.45rem;
  transition: border-color 0.25s, box-shadow 0.25s;
  &:hover { border-color: rgba(26, 26, 26, 0.25); box-shadow: 0 14px 34px rgba(26, 26, 26, 0.12); }
`;

const GiftIconWrap = styled.div`
  display: flex; align-items: center; justify-content: center;
  width: 34px; height: 34px;
  color: ${RED};
  margin-bottom: 0.2rem;
`;
const GiftValue = styled.p`
  font-size: 2rem; letter-spacing: 1px;
  color: ${INK}; margin: 0;
`;
const GiftLabel = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 0.75rem; font-weight: 600;
  color: rgba(26, 26, 26, 0.5); letter-spacing: 1px; margin: 0;
`;
const GiftSub = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 0.72rem; font-weight: 500;
  color: rgba(26, 26, 26, 0.75); margin: 0; line-height: 1.4;
`;

const CustomAmountRow = styled.div`
  display: flex; gap: 0.5rem; width: 100%; margin-top: 0.1rem;
`;

const CustomInput = styled.input`
  flex: 1; min-width: 0;
  background: transparent; border: 1px solid rgba(26, 26, 26, 0.15);
  color: ${INK};
  font-family: 'Montserrat', sans-serif; font-size: 0.88rem;
  padding: 0.45rem 0.7rem; outline: none; text-align: center;
  transition: border-color 0.2s;
  &:focus { border-color: rgba(26, 26, 26, 0.4); }
  &::placeholder { color: rgba(26, 26, 26, 0.3); }
`;
