import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";
import * as express from "express";
import axios from "axios";

// Inicializar Firebase Admin
admin.initializeApp();

const corsHandler = cors({ origin: true });
const app = express();

// ==================== CONFIGURACIÓN TILOPAY ====================
const TILOPAY_API_KEY = process.env.TILOPAY_API_KEY || "sk_test_xxx";
const TILOPAY_MERCHANT_ID = process.env.TILOPAY_MERCHANT_ID || "merchant_xxx";
const TILOPAY_API = "https://api.tilopay.com/v1";

// ==================== CREAR SESIÓN DE PAGO TILOPAY ====================
app.post("/crear-sesion-tilopay", async (req, res) => {
  try {
    const { planId, email, empresaId, planNombre, monto, moneda } = req.body;
    const referencia = `TILOPAY-${Date.now()}-${empresaId.slice(0, 5)}`;

    if (!planId || !email || !empresaId || !monto) {
      return res.status(400).json({ error: "Campos requeridos faltantes" });
    }

    // Crear transacción en Tilopay
    const response = await axios.post(
      `${TILOPAY_API}/transactions`,
      {
        reference: referencia,
        amount: monto,
        currency: moneda || "USD",
        concept: `Suscripción ${planNombre}`,
        customer: {
          email: email,
          name: email.split("@")[0],
        },
        notification_url: `${process.env.FRONTEND_URL || "http://localhost:4200"}/api/webhook-tilopay`,
        return_url: `${process.env.FRONTEND_URL || "http://localhost:4200"}/pagos/callback`,
      },
      {
        headers: {
          Authorization: `Bearer ${TILOPAY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.data?.id) {
      // Guardar referencia en Firestore
      await admin.firestore().collection("pagos_tilopay").add({
        transactionId: response.data.data.id,
        referencia,
        empresaId,
        planId,
        email,
        monto,
        moneda: moneda || "USD",
        estado: "pendiente",
        fecha: new Date(),
      });

      return res.json({
        transactionId: response.data.data.id,
        url: response.data.data.payment_url,
        referencia,
      });
    } else {
      throw new Error("No transaction ID returned from Tilopay");
    }
  } catch (error: any) {
    console.error("Error creando sesión Tilopay:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ==================== VERIFICAR ESTADO DE PAGO ====================
app.get("/verificar-pago-tilopay/:reference", async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(`${TILOPAY_API}/transactions/${reference}`, {
      headers: {
        Authorization: `Bearer ${TILOPAY_API_KEY}`,
      },
    });

    return res.json({
      status: response.data?.data?.status,
      approved: response.data?.data?.status === "completed",
      reference: response.data?.data?.reference,
      amount: response.data?.data?.amount,
    });
  } catch (error: any) {
    console.error("Error verificando pago:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ==================== WEBHOOK DE TILOPAY ====================
app.post("/webhook-tilopay", express.json(), async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !data.reference) {
      return res.status(400).json({ error: "Invalid webhook data" });
    }

    const pagoSnapshot = await admin
      .firestore()
      .collection("pagos_tilopay")
      .where("referencia", "==", data.reference)
      .limit(1)
      .get();

    if (!pagoSnapshot.empty) {
      const pagoDoc = pagoSnapshot.docs[0];
      const pagoData = pagoDoc.data();

      if (data.status === "completed") {
        // Guardar transacción
        const transaccion = {
          empresaId: pagoData.empresaId,
          planId: pagoData.planId,
          tilopayTransactionId: data.id,
          referencia: data.reference,
          monto: data.amount,
          moneda: data.currency,
          estado: "completado",
          email: pagoData.email,
          fecha: new Date(),
          metodoPago: "tilopay",
        };

        await admin.firestore().collection("transacciones").add(transaccion);

        // Actualizar plan de empresa
        await admin
          .firestore()
          .collection("empresas")
          .doc(pagoData.empresaId)
          .update({
            plan: pagoData.planId,
            suscripcion: {
              estado: "activo",
              planId: pagoData.planId,
              fecha_inicio: new Date(),
              fecha_proximo_pago: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ),
            },
          });

        // Actualizar estado del pago
        await pagoDoc.ref.update({
          estado: "completado",
          fecha_completado: new Date(),
        });

        console.log(`Pago completado: ${data.reference}`);
      } else {
        await pagoDoc.ref.update({
          estado: data.status || "fallido",
          razon: data.status,
        });
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("Error en webhook:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// ==================== OBTENER TRANSACCIONES ====================
app.get("/historial-tilopay/:empresaId", async (req, res) => {
  try {
    const { empresaId } = req.params;

    const snapshot = await admin
      .firestore()
      .collection("transacciones")
      .where("empresaId", "==", empresaId)
      .where("metodoPago", "==", "tilopay")
      .orderBy("fecha", "desc")
      .limit(50)
      .get();

    const transacciones = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json(transacciones);
  } catch (error: any) {
    console.error("Error obteniendo transacciones:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ==================== EXPORTAR FUNCIONES ====================
exports.pagos = functions
  .region("us-central1")
  .https
  .onRequest((req, res) => {
    corsHandler(req, res, () => {
      app(req, res);
    });
  });
