function TopNavBar() {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-260px)] h-16 bg-surface border-b border-outline-variant flex justify-between items-center px-gutter z-40">
      <div className="flex items-center gap-4">
        <span className="text-headline-sm text-primary font-bold">TaskMaster Admin</span>
        <div className="hidden md:flex relative ml-8">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
          <input
            className="pl-10 pr-4 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm w-64 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
            placeholder="Search operations..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex gap-4">
          <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:scale-95">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:scale-95">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>
        <div className="h-8 w-px bg-outline-variant" />
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="text-right">
            <p className="text-label-md text-primary font-bold">Administrator</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Super Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm border-2 border-primary-container">
            A
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopNavBar;
