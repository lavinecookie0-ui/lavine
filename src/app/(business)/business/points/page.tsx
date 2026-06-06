'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Star, Gift, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToDocument, subscribeToPointsTransactions, subscribeToWheelPrizes, checkTodaySpin, spinWheel, subscribeToRewardOptions, subscribeToBusinessRewardRequests, createRewardRequest } from '@/lib/firebase/firestore';
import { Business, PointsTransaction, WheelPrize, RewardOption, RewardRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function BusinessPointsPage() {
  const { userData, currentUser } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const currentActor = { id: currentUser?.uid || userData?.uid || 'unknown', name: business?.name || currentUser?.email || 'İşletme', role: 'business' as const };
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [prizes, setPrizes] = useState<WheelPrize[]>([]);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const [activeTab, setActiveTab] = useState<'history' | 'rewards'>('history');
  const [rewardOptions, setRewardOptions] = useState<RewardOption[]>([]);
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!userData?.businessId) return;

    const u1 = subscribeToDocument<Business>('businesses', userData.businessId, d => setBusiness(d));
    const u2 = subscribeToPointsTransactions(userData.businessId, txs => setTransactions(txs));
    const u3 = subscribeToWheelPrizes(data => {
      setPrizes(data.filter(p => p.isActive));
    });
    const u4 = subscribeToRewardOptions(data => setRewardOptions(data.filter(o => o.isActive)));
    const u5 = subscribeToBusinessRewardRequests(userData.businessId, data => setRewardRequests(data));

    checkTodaySpin(userData.businessId).then(setHasSpunToday);

    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [userData?.businessId]);

  const handleSpin = async () => {
    if (!userData?.businessId) return;
    if (hasSpunToday) {
      toast.error('Bugünkü çevirme hakkınızı kullandınız.');
      return;
    }
    if (prizes.length === 0) {
      toast.error('Aktif çark ödülü bulunamadı.');
      return;
    }

    setIsSpinning(true);
    try {
      const prize = await spinWheel(userData.businessId, currentActor);
      
      // Calculate rotation to land on the correct slice
      const sliceAngle = 360 / prizes.length;
      const prizeIndex = prizes.findIndex(p => p.id === prize.id);
      
      // We want the slice to land at the top (which is 0 degrees). 
      // If we rotate the wheel by N degrees, the top slice moves.
      // Easiest is just a random many-spin rotation plus the offset.
      const extraSpins = 360 * 5; // 5 full spins
      const targetRotation = extraSpins - (prizeIndex * sliceAngle) - (sliceAngle / 2) + Math.random() * (sliceAngle * 0.8) - (sliceAngle * 0.4);
      
      setRotation(prev => prev + targetRotation + 360); // Ensure it keeps going forward
      
      // Wait for animation
      setTimeout(() => {
        setIsSpinning(false);
        setWonPrize(prize);
        setShowResultModal(true);
        setHasSpunToday(true);
      }, 4000);

    } catch (error: any) {
      toast.error(error.message || 'Çark çevrilirken bir hata oluştu.');
      setIsSpinning(false);
    }
  };

  // Generate conic gradient for the wheel
  const getWheelBackground = () => {
    if (prizes.length === 0) return '#1e1e2a';
    const slicePct = 100 / prizes.length;
    const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#ec4899', '#14b8a6', '#f97316'];
    const parts = prizes.map((_, i) => `${colors[i % colors.length]} ${i * slicePct}% ${(i + 1) * slicePct}%`);
    return `conic-gradient(${parts.join(', ')})`;
  };

  const balance = business?.pointsBalance ?? business?.totalPoints ?? 0;

  const handleRequestReward = async (option: RewardOption) => {
    if (!business) return;
    if (balance < option.points) {
      toast.error('Puanınız yetersiz.');
      return;
    }
    setIsRequesting(true);
    try {
      await createRewardRequest({
        businessId: business.id,
        businessName: business.name,
        rewardOptionId: option.id,
        rewardTitle: option.title,
        points: option.points,
      }, currentActor);
      toast.success('Hediye çeki talebiniz alındı. Onaylandığında puanınız düşülecektir.');
    } catch (e: any) {
      toast.error(e.message || 'Hata oluştu');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>Şans Çarkı & Puanlar</h1>
        <p style={{ fontSize: 13, color: '#5c5c70', marginTop: 4 }}>Günlük şansınızı deneyin ve siparişlerinizde kullanabileceğiniz puanlar kazanın.</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24, alignItems: 'start' }}>
          
          {/* Left: Wheel */}
          <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', padding: '8px 16px', borderRadius: 20, fontSize: 18, fontWeight: 800 }}>
                <Star fill="currentColor" /> {balance} Puan
              </div>
            </div>

            <div style={{ position: 'relative', width: 300, height: 300 }}>
              {/* Pointer */}
              <div style={{ position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '15px solid transparent', borderRight: '15px solid transparent', borderTop: '30px solid #f1f1f5', zIndex: 10, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}></div>
              
              {/* Wheel */}
              <div style={{ 
                width: '100%', height: '100%', borderRadius: '50%', 
                background: getWheelBackground(),
                border: '6px solid #1e1e2a',
                boxShadow: '0 0 0 2px rgba(255,255,255,0.1), 0 12px 32px rgba(0,0,0,0.4)',
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 4s cubic-bezier(0.15, 0.9, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {prizes.length > 0 && prizes.map((prize, i) => {
                  const angle = (360 / prizes.length) * i + (360 / prizes.length / 2);
                  return (
                    <div key={prize.id} style={{
                      position: 'absolute',
                      top: '0', left: '50%',
                      width: '50%', height: '50%',
                      transformOrigin: '0% 100%',
                      transform: `rotate(${angle - 90 + (360/prizes.length/2)}deg) skewY(${90 - (360/prizes.length)}deg)`,
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
                    }}>
                      <div style={{
                        transform: `skewY(-${90 - (360/prizes.length)}deg) rotate(${(360/prizes.length)/2}deg)`,
                        position: 'absolute',
                        bottom: '20px', left: '20px',
                        color: '#fff', fontSize: 14, fontWeight: 800,
                        textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                        textAlign: 'center', width: 60,
                        transformOrigin: 'bottom left'
                      }}>
                        {prize.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 40, width: '100%', maxWidth: 260 }}>
              {hasSpunToday ? (
                <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '16px', borderRadius: 12, textAlign: 'center', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <Clock size={16} /> Bugünkü hakkınızı kullandınız.
                </div>
              ) : (
                <Button fullWidth size="lg" onClick={handleSpin} loading={isSpinning} style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000', border: 'none' }}>
                  Çarkı Çevir
                </Button>
              )}
            </div>
          </div>

          {/* Right: History & Rewards */}
          <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 600 }}>
            <div style={{ padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center' }}>
              <button 
                onClick={() => setActiveTab('history')}
                style={{ padding: '20px 16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'history' ? '2px solid #fbbf24' : '2px solid transparent', color: activeTab === 'history' ? '#fbbf24' : '#5c5c70', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <Clock size={16} /> Puan Geçmişi
              </button>
              <button 
                onClick={() => setActiveTab('rewards')}
                style={{ padding: '20px 16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'rewards' ? '2px solid #fbbf24' : '2px solid transparent', color: activeTab === 'rewards' ? '#fbbf24' : '#5c5c70', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <Gift size={16} /> Hediye Çekleri
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {activeTab === 'history' && (
                <>
                  {transactions.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#5c5c70' }}>
                      <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                      <p style={{ fontSize: 13, margin: 0 }}>Henüz puan hareketiniz yok.</p>
                    </div>
                  ) : (
                    transactions.map(tx => (
                      <div key={tx.id} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{tx.description}</p>
                          <p style={{ fontSize: 11, color: '#5c5c70', margin: '4px 0 0' }}>{formatRelativeTime(tx.createdAt)}</p>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: tx.points > 0 ? '#34d399' : '#f87171' }}>
                          {tx.points > 0 ? '+' : ''}{tx.points}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {activeTab === 'rewards' && (
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#f1f1f5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Ödül Seçenekleri</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                    {rewardOptions.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#5c5c70', margin: 0 }}>Aktif ödül seçeneği bulunmuyor.</p>
                    ) : (
                      rewardOptions.map(opt => (
                        <div key={opt.id} style={{ padding: '16px', background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#f1f1f5', margin: '0 0 4px' }}>{opt.title}</p>
                            <p style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600, margin: 0 }}>{opt.points} Puan</p>
                          </div>
                          <Button size="sm" onClick={() => handleRequestReward(opt)} disabled={balance < opt.points || isRequesting}>Talep Et</Button>
                        </div>
                      ))
                    )}
                  </div>

                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#f1f1f5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Taleplerim</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rewardRequests.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#5c5c70', margin: 0 }}>Henüz talebiniz yok.</p>
                    ) : (
                      rewardRequests.map(req => (
                        <div key={req.id} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5' }}>{req.rewardTitle}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, 
                              background: req.status === 'approved' ? 'rgba(52,211,153,0.1)' : req.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)',
                              color: req.status === 'approved' ? '#34d399' : req.status === 'rejected' ? '#f87171' : '#fbbf24'
                            }}>
                              {req.status === 'approved' ? 'Onaylandı' : req.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, color: '#5c5c70' }}>{formatRelativeTime(req.createdAt)}</span>
                            <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>{req.points} Puan</span>
                          </div>
                          {req.status === 'approved' && req.giftCode && (
                            <div style={{ marginTop: 8, padding: '8px', background: '#16161e', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, color: '#9898a8' }}>Hediye Kodu:</span>
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24', letterSpacing: '0.1em' }}>{req.giftCode}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showResultModal} onClose={() => setShowResultModal(false)} title="Tebrikler! 🎉" size="sm" footer={<Button fullWidth onClick={() => setShowResultModal(false)}>Harika!</Button>}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Gift size={64} color="#fbbf24" style={{ margin: '0 auto 16px', filter: 'drop-shadow(0 0 16px rgba(251,191,36,0.5))' }} />
          <h3 style={{ fontSize: 24, fontWeight: 800, color: '#f1f1f5', margin: '0 0 8px' }}>{wonPrize?.points} Puan Kazandınız!</h3>
          <p style={{ fontSize: 14, color: '#9898a8', margin: 0 }}>Kazandığınız bu puan bakiyenize eklendi.</p>
        </div>
      </Modal>

    </div>
  );
}
