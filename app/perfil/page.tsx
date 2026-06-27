'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { initDemoData } from '@/lib/initDemoData';

export default function PerfilPage() {
  const { user, loading } = useAuth();
  const [profileImage, setProfileImage] = useState('https://picsum.photos/seed/academic/200/200');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('estudante');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) {
      initDemoData(user.id, user.email);
      
      // Carregar imagem de perfil
      const savedImage = localStorage.getItem(`profileImage_${user.id}`);
      if (savedImage) {
        setProfileImage(savedImage);
      } else {
        setProfileImage(`https://picsum.photos/seed/${user.id}/200/200`);
      }

      // Carregar dados de perfil
      const savedData = localStorage.getItem(`profile_data_${user.id}`);
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          setName(data.name || '');
          setEmail(data.email || user.email || '');
          setUserType(data.userType || 'estudante');
          setTitle(data.title || '');
          setBio(data.bio || '');
        } catch (e) {
          setName(user.user_metadata?.full_name || '');
          setEmail(user.email || '');
        }
      } else {
        setName(user.user_metadata?.full_name || '');
        setEmail(user.email || '');
      }
    }
  }, [user]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && user?.id) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem(`profileImage_${user.id}`, base64String);
        setProfileImage(base64String);
        window.dispatchEvent(new Event('profileImageUpdated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.id) {
      const profileData = {
        name,
        email,
        userType,
        title,
        bio
      };
      localStorage.setItem(`profile_data_${user.id}`, JSON.stringify(profileData));
      window.dispatchEvent(new Event('profileUpdated'));
      alert('Perfil salvo com sucesso!');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center font-sans text-on-surface-variant gap-3">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
        <span>Carregando perfil...</span>
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full p-8">
      <h1 className="text-3xl font-bold font-serif mb-8 text-primary">Meu Perfil</h1>
      
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-8 flex flex-col items-center sm:flex-row sm:items-start gap-8 mb-8">
        <div className="flex flex-col items-center gap-4 flex-shrink-0">
          <div 
            onClick={handleImageClick}
            className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-surface-container shadow-sm cursor-pointer group"
          >
            <Image 
              src={profileImage} 
              alt="User profile" 
              width={128} 
              height={128} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Alterar</span>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
          />
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {userType === 'administrador' ? 'Administrador' : userType === 'orientador' ? 'Orientador' : 'Estudante'}
          </div>
        </div>
        
        <div className="flex-1 border-t border-outline-variant sm:border-t-0 sm:border-l sm:pl-8 pt-8 sm:pt-0 w-full">
          <form className="flex flex-col gap-6" onSubmit={handleSaveProfile}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Nome Completo</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="p-3 w-full border border-outline-variant rounded-md bg-surface-container-lowest outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">E-mail</label>
                <input type="email" value={email} readOnly className="p-3 w-full border border-outline-variant rounded-md bg-surface-container-lowest outline-none opacity-70 cursor-not-allowed" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Tipo de Usuário</label>
                <select className="p-3 w-full border border-outline-variant rounded-md bg-surface-container-lowest outline-none focus:ring-1 focus:ring-primary" value={userType} onChange={(e) => setUserType(e.target.value)}>
                  <option value="administrador">Administrador</option>
                  <option value="orientador">Orientador</option>
                  <option value="estudante">Estudante</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Especialidade / Título</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="p-3 w-full border border-outline-variant rounded-md bg-surface-container-lowest outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-on-surface">Biografia Breve</label>
              <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className="p-3 w-full border border-outline-variant rounded-md bg-surface-container-lowest outline-none focus:ring-1 focus:ring-primary resize-none"></textarea>
            </div>
            
            <div className="flex justify-end mt-4">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-md font-semibold transition-colors">Salvar Alterações</button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-8">
        <h2 className="text-xl font-bold font-serif mb-6 text-on-surface">Alterar Senha</h2>
        <form className="flex flex-col gap-6 max-w-md">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface">Senha Atual</label>
            <input type="password" placeholder="••••••••" className="p-3 w-full border border-outline-variant rounded-md bg-surface-container-lowest outline-none focus:ring-1 focus:ring-primary tracking-widest" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface">Nova Senha</label>
            <input type="password" placeholder="••••••••" className="p-3 w-full border border-outline-variant rounded-md bg-surface-container-lowest outline-none focus:ring-1 focus:ring-primary tracking-widest" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface">Confirmar Nova Senha</label>
            <input type="password" placeholder="••••••••" className="p-3 w-full border border-outline-variant rounded-md bg-surface-container-lowest outline-none focus:ring-1 focus:ring-primary tracking-widest" />
          </div>
          
          <div className="flex mt-2">
            <button type="button" className="bg-on-surface hover:bg-on-surface-variant text-surface px-6 py-2.5 rounded-md font-semibold transition-colors">Atualizar Senha</button>
          </div>
        </form>
      </div>
    </main>
  );
}
