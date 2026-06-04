import { useSearchParams } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import ExportPanel from "../components/export/ExportPanel";

const ExportPage = () => {

    const [searchParams] = useSearchParams();

    const selectedDocumentId = Number(searchParams.get("document_id"));

    return (
        <MainLayout>

            <ExportPanel selectedDocumentId={selectedDocumentId || undefined} />

        </MainLayout>
    );
};

export default ExportPage;