function AuthLayout({ children }) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
          {children}
        </div>
      </div>
    );
  }
  
  export default AuthLayout;