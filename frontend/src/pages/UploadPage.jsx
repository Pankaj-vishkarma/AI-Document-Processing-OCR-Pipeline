import MainLayout from "../layouts/MainLayout";
import DocumentUploader from "../components/upload/DocumentUploader";

const UPLOAD_PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .up-page-bg {
    min-height: 100vh;
    background: radial-gradient(circle at top left, rgba(91,110,245,0.18), transparent 24%),
                radial-gradient(circle at 90% 10%, rgba(34,211,238,0.14), transparent 20%),
                linear-gradient(180deg, #070b18 0%, #0e172c 100%);
    color: #e2e8f0;
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .up-page-container {
    padding: 32px 28px 48px;
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .up-page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 18px;
  }

  .up-page-title {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: clamp(1.8rem, 3vw, 2.4rem);
    line-height: 1.08;
    letter-spacing: -0.02em;
    color: #ffffff;
    margin: 0 0 10px;
  }

  .up-page-subtitle {
    color: #cbd5e1;
    font-size: 0.95rem;
    line-height: 1.7;
    margin: 0;
    max-width: 690px;
  }

  @media (max-width: 768px) {
    .up-page-container {
      padding: 20px 16px 38px;
      gap: 22px;
    }
    .up-page-title {
      font-size: 1.6rem;
    }
  }
`;

const UploadPage = () => {
    return (
        <MainLayout>
            <style>{UPLOAD_PAGE_STYLES}</style>
            <div className="up-page-bg">
                <div className="up-page-container">
                    <div className="up-page-header">
                        <div>
                            <h1 className="up-page-title">Upload Documents</h1>
                            <p className="up-page-subtitle">
                                Upload and process documents using AI-powered OCR extraction. Drag & drop files or click to select.
                            </p>
                        </div>
                    </div>
                    <DocumentUploader />
                </div>
            </div>
        </MainLayout>
    );
};

export default UploadPage;