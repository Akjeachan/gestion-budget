import React, { useState, useEffect } from "react";
import { ListBonprecommandeavalider } from "../services/api";

function DebugBonPrecommande() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await ListBonprecommandeavalider();
            setData(res);
        } catch (e) {
            setError(e.message || String(e));
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div style={{ padding: 24 }}>
            <h1>Debug: ListBonprecommandeavalider()</h1>

            <div style={{ margin: "12px 0" }}>
                <button onClick={fetchData} style={{ padding: "8px 12px", marginRight: 8 }}>
                    Rafraîchir
                </button>
            </div>

            {loading && <div>Chargement...</div>}
            {error && <div style={{ color: "#b91c1c" }}>Erreur: {error}</div>}

            {!loading && !error && (
                <pre style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    background: "#f3f4f6",
                    padding: 12,
                    borderRadius: 6,
                    overflowX: "auto"
                }}>
                    {JSON.stringify(data, null, 2)}
                </pre>
            )}
        </div>
    );
}

export default DebugBonPrecommande;
