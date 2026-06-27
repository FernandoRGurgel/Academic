export default function ConfiguracoesPage() {
  return (
    <main className="flex-1 max-w-4xl mx-auto w-full p-8">
      <h1 className="text-3xl font-bold font-serif mb-8 text-primary">Configurações</h1>
      
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-on-surface">Notificações</h2>
        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-sm text-on-surface">Notificações por E-mail</p>
              <p className="text-xs text-on-surface-variant">Receber atualizações sobre prazos e pagamentos via e-mail.</p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </div>
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-sm text-on-surface">Alertas de Prazo Crítico</p>
              <p className="text-xs text-on-surface-variant">Alertar na interface e por e-mail 24h antes do vencimento do trabalho.</p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </div>
          </label>
        </div>
      </div>
      
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-6">
        <h2 className="text-lg font-semibold mb-4 text-on-surface">Preferências do Sistema</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface">Tema</label>
            <select className="p-3 border border-outline-variant rounded-md bg-surface-container-lowest outline-none focus:ring-1 focus:ring-primary w-full max-w-sm">
              <option value="light">Claro (Padrão)</option>
              <option value="dark">Escuro</option>
              <option value="system">Seguir o sistema</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface">Fuso Horário Principal</label>
            <select className="p-3 border border-outline-variant rounded-md bg-surface-container-lowest outline-none focus:ring-1 focus:ring-primary w-full max-w-sm">
              <option value="America/Sao_Paulo">Brasília (America/Sao_Paulo)</option>
              <option value="UTC">UTC (Padrão Internacional)</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end mt-8">
          <button type="button" className="bg-primary hover:bg-primary/90 text-on-primary px-6 py-2.5 rounded-md font-semibold transition-colors">Salvar Configurações</button>
        </div>
      </div>
    </main>
  );
}
