import type {Metadata} from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aviso de Privacidad | nabbi",
  description:
    "Aviso de privacidad de nabbi. Conoce cómo recopilamos, usamos y protegemos tus datos personales.",
};

const INK = "#12211A";
const MAIN = "#558367";

export default function AvisoPrivacidadPage() {
  return (
    <div
      style={{
        background: "var(--color-background, #FAF8F3)",
        color: "var(--color-foreground, #1F3328)",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--color-border, #CCD8CE)",
          padding: "20px 0",
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: INK,
              textDecoration: "none",
              letterSpacing: "-0.03em",
            }}
          >
            nabbi
          </Link>
          <Link
            href="/"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: MAIN,
              textDecoration: "none",
            }}
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px"}}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: 8,
          }}
        >
          Aviso de Privacidad
        </h1>
        <p style={{fontSize: 14, color: "var(--color-foreground-muted, #5A7D6A)", marginBottom: 40}}>
          Última actualización: 01 de Agosto de 2026
        </p>

        <div style={{fontSize: 16, lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 32}}>
          <p>
            En Nabbi tu privacidad nos importa. Este Aviso de Privacidad te explica, de forma clara, qué datos personales
            recabamos, para qué los usamos, con quién los compartimos y cómo puedes controlarlos, incluyendo cómo eliminar
            tu cuenta y tus datos en cualquier momento.
          </p>

          <p>
            Este documento cumple con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares
            (la &quot;Ley&quot;), vigente en México desde el 21 de marzo de 2025, y con las políticas de privacidad de las
            tiendas App Store (Apple) y Google Play (Google).
          </p>

          <p>
            <strong>En resumen:</strong> Usamos tus datos para que puedas reservar y ofrecer servicios, comunicarte con
            otros usuarios y mantener la app segura. Los pagos los procesa un tercero (Stripe), no Nabbi, por lo que no
            guardamos los datos de tu tarjeta. No vendemos tus datos. Puedes acceder, corregir o eliminar tu
            información —y tu cuenta completa— cuando quieras.
          </p>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>1. Quién es responsable de tus datos</h2>
            <p>
              El responsable del tratamiento de tus datos personales es Spotynet S.A de C.V. (en adelante &quot;Nabbi&quot;),
              con domicilio en la Calle Orizaba 154, Roma Norte, Cuauhtemoc, 06700 CDMX.
            </p>
            <p style={{marginTop: 12}}>
              Si tienes dudas sobre este Aviso o quieres ejercer tus derechos, escríbenos a: nabbi@spotynet.com
            </p>
            <p style={{marginTop: 12}}>
              Este Aviso aplica a la aplicación móvil Nabbi (disponible en App Store y Google Play) y al sitio web
              https://nabbi-mobile-dev.spotynet.com/.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>2. A quién aplica</h2>
            <p>Este Aviso aplica a todas las personas que usan Nabbi:</p>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li><strong>Clientes:</strong> personas que buscan, reservan y contratan servicios.</li>
              <li><strong>Profesionales:</strong> personas que ofrecen y prestan servicios a través de la app.</li>
              <li><strong>Visitantes</strong> del sitio web y de la aplicación.</li>
            </ul>
            <p style={{marginTop: 12}}>
              Nabbi es solo para mayores de 18 años. No está dirigida a menores de edad y no recabamos datos de menores de
              forma intencional. Si detectamos datos de un menor, los eliminaremos. Si eres padre, madre o tutor y crees que
              un menor nos proporcionó datos, escríbenos a nabbi@spotynet.com
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>3. Qué datos recabamos</h2>
            <p>Según cómo uses la app, podemos recabar:</p>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li><strong>Datos de identificación y contacto:</strong> nombre, fecha de nacimiento (para confirmar que eres mayor de edad), correo electrónico, teléfono, zona o domicilio de servicio, nombre de usuario y foto de perfil.</li>
              <li><strong>Datos del perfil y de la actividad (Profesionales):</strong> categoría, descripción de servicios, precios, horarios y disponibilidad.</li>
              <li><strong>Datos de reservas y transacciones:</strong> servicios contratados, fechas, horarios, montos, historial y los mensajes que intercambias con otros usuarios dentro de la app.</li>
              <li><strong>Contenido que publicas:</strong> publicaciones (&quot;posts&quot;), fotografías, reseñas y calificaciones.</li>
              <li><strong>Datos de pago:</strong> los pagos en línea son procesados directamente por un proveedor externo de servicios de pago, actualmente Stripe, no por Nabbi. Los datos de tu tarjeta o de tu cuenta se ingresan y son tratados por dicho proveedor conforme a su propia política de privacidad. Nabbi no almacena el número completo de tu tarjeta ni tus datos bancarios; solo conservamos datos limitados de la operación (por ejemplo, referencia, últimos dígitos y estatus del pago) que el proveedor nos comparte.</li>
              <li><strong>Datos fiscales</strong> (cuando aplica, sobre todo Profesionales): RFC, régimen fiscal y domicilio fiscal para emitir comprobantes.</li>
              <li><strong>Datos del dispositivo y de uso:</strong> dirección IP, identificadores del dispositivo, sistema operativo, tipo de dispositivo, versión de la app, datos de uso, reportes de fallos y diagnósticos.</li>
              <li><strong>Ubicación:</strong> si tú lo autorizas, usamos tu ubicación para mostrarte profesionales o servicios cercanos. Puedes activarla o desactivarla desde los ajustes de tu dispositivo.</li>
            </ul>
            <p style={{marginTop: 16, fontWeight: 700}}>Datos sensibles</p>
            <p style={{marginTop: 8}}>
              Nabbi no solicita datos sensibles para su funcionamiento habitual. Si un servicio específico llegara a
              implicarlos, te pediremos tu consentimiento expreso antes de recabarlos, únicamente para esa finalidad.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>4. Permisos que solicita la app</h2>
            <p>Para ciertas funciones, la app puede pedirte permiso para acceder a:</p>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li><strong>Cámara y fotos/galería:</strong> para subir tu foto de perfil, imágenes de servicios o adjuntar fotos.</li>
              <li><strong>Ubicación:</strong> para mostrarte resultados cercanos (opcional).</li>
              <li><strong>Notificaciones:</strong> para enviarte confirmaciones y recordatorios de reservas.</li>
            </ul>
            <p style={{marginTop: 12}}>
              Puedes conceder o revocar estos permisos en cualquier momento desde los ajustes de tu dispositivo. Si los
              desactivas, algunas funciones podrían no estar disponibles.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>5. Para qué usamos tus datos</h2>
            <p style={{fontWeight: 700}}>Finalidades principales (necesarias para que la app funcione)</p>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li>Crear, verificar y administrar tu cuenta y tu perfil.</li>
              <li>Publicar perfiles, servicios, precios, horarios y disponibilidad de los Profesionales.</li>
              <li>Permitir la búsqueda, el agendamiento y la confirmación de reservas.</li>
              <li>Permitir el procesamiento de los pagos en línea a través de un proveedor externo de pago (actualmente Stripe).</li>
              <li>Habilitar la comunicación entre usuarios y enviarte confirmaciones, recordatorios y notificaciones.</li>
              <li>Gestionar reseñas, calificaciones y publicaciones.</li>
              <li>Brindarte soporte y atender tus dudas, quejas y aclaraciones.</li>
              <li>Cumplir obligaciones legales, fiscales y contables.</li>
              <li>Mantener la seguridad de la app y prevenir fraudes y usos indebidos.</li>
            </ul>
            <p style={{marginTop: 16, fontWeight: 700}}>Finalidades secundarias (opcionales)</p>
            <p style={{marginTop: 8}}>Solo con tu consentimiento, podemos usar tus datos para:</p>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li>Enviarte promociones, novedades y ofertas de Nabbi.</li>
              <li>Realizar encuestas de satisfacción y estudios de mercado.</li>
              <li>Generar estadísticas y personalizar contenido para mejorar la app.</li>
            </ul>
            <p style={{marginTop: 12}}>
              Puedes negarte a estas finalidades secundarias sin que afecte tu uso de la app. Solo escríbenos a
              nabbi@spotynet.com o usa las opciones dentro de la app.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>6. Con quién compartimos tus datos</h2>
            <p>No vendemos tus datos personales. Los compartimos únicamente cuando es necesario, con:</p>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li>
                <strong>Proveedores que trabajan para nosotros (encargados):</strong> empresas que nos dan servicios de
                tecnología y que tratan los datos solo bajo nuestras instrucciones y con obligaciones de confidencialidad
                y seguridad, como:
                <ul style={{margin: "8px 0 0 20px", display: "flex", flexDirection: "column", gap: 4}}>
                  <li>Alojamiento e infraestructura en la nube (hosting).</li>
                  <li>Procesador de pagos, actualmente Stripe, para procesar y resguardar los pagos de las reservas y liquidarlos a los Profesionales.</li>
                  <li>Servicios de mensajería y notificaciones push.</li>
                  <li>Herramientas de analítica y de reporte de fallos para entender el uso y mejorar la app.</li>
                  <li>Servicios de mapas y geolocalización, cuando aplique.</li>
                </ul>
              </li>
              <li><strong>Otros usuarios:</strong> cuando reservas o prestas un servicio, compartimos con la otra parte solo la información necesaria para concretarlo (por ejemplo, nombre y datos de la reserva).</li>
              <li><strong>Autoridades competentes:</strong> cuando exista una obligación legal o un requerimiento fundado y motivado.</li>
              <li><strong>Empresas del mismo grupo o filiales</strong> de Nabbi que operen con políticas de privacidad equivalentes.</li>
            </ul>
            <p style={{marginTop: 16, fontWeight: 700}}>Nota sobre el procesador de pagos:</p>
            <p style={{marginTop: 8}}>
              Stripe trata tus datos de pago como responsable independiente, conforme a su propio aviso de privacidad,
              disponible en https://stripe.com/privacy. Nabbi no tiene acceso a los datos completos de tu tarjeta. Te
              recomendamos revisar la política de privacidad de Stripe.
            </p>
            <p style={{marginTop: 12}}>
              Algunos de estos proveedores pueden estar ubicados fuera de México. En las transferencias que, conforme a la
              Ley, requieran tu consentimiento, lo recabaremos previamente. No realizamos transferencias distintas a las
              aquí descritas sin cumplir los requisitos legales.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>7. Cómo eliminas tu cuenta y tus datos</h2>
            <p>Puedes eliminar tu cuenta y los datos asociados en cualquier momento, por cualquiera de estas dos vías:</p>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li><strong>Dentro de la app:</strong> en Ajustes → Cuenta → Eliminar cuenta [ajustar a la ruta real de la app].</li>
              <li>
                <strong>Desde la web / por correo:</strong> solicita la eliminación en
                [https://nabbi-mobile-dev.spotynet.com/eliminar-cuenta] o escribiendo a nabbi@spotynet.com, aunque
                ya no tengas la app instalada.
              </li>
            </ul>
            <p style={{marginTop: 12}}>
              Al eliminar tu cuenta, borraremos o anonimizaremos tus datos personales, salvo aquellos que debamos conservar
              por obligaciones legales, fiscales o contables, o para la defensa de posibles reclamaciones. Esos datos se
              conservarán bloqueados solo por el tiempo que la ley exija y después se suprimirán.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>8. Tus derechos ARCO</h2>
            <p>
              Tienes derecho a Acceder a tus datos, Rectificarlos si son incorrectos, Cancelarlos cuando ya no sean necesarios
              y Oponerte a ciertos usos. También puedes revocar tu consentimiento y limitar el uso o divulgación de tus datos.
            </p>
            <p style={{marginTop: 12}}>
              Para ejercerlos, escríbenos a [privacidad@spotynet.com] e incluye: tu nombre y un medio para responderte, una
              identificación que acredite tu identidad (o representación legal), la descripción clara de lo que solicitas, y
              cualquier dato que ayude a localizar tu información.
            </p>
            <p style={{marginTop: 12}}>
              Te responderemos en los plazos que marca la Ley. El ejercicio de estos derechos es gratuito; solo cubrirías, en
              su caso, los gastos justificados de envío o reproducción. También puedes inscribirte en el Registro Público para
              Evitar Publicidad (REPEP) de la PROFECO para dejar de recibir publicidad.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>9. Cómo protegemos tus datos</h2>
            <p>
              Aplicamos medidas de seguridad administrativas, técnicas y físicas razonables para proteger tus datos frente a
              pérdida, mal uso, acceso no autorizado o divulgación. Ningún sistema es 100% infalible; si ocurriera una
              vulneración que afecte de forma significativa tus derechos, te lo notificaremos conforme a la Ley.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>10. Cookies y tecnologías similares</h2>
            <p>
              En el sitio web y la app usamos cookies e identificadores para recordar tus preferencias, mantener tu sesión,
              analizar el uso y mejorar tu experiencia. Puedes desactivarlas desde tu navegador o dispositivo, aunque algunas
              funciones podrían verse afectadas.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>11. Tiendas de aplicaciones</h2>
            <p>
              Nabbi se distribuye a través de App Store (Apple) y Google Play (Google). Estas plataformas tienen sus propias
              políticas de privacidad y pueden recabar datos de forma independiente cuando descargas o usas la app; te
              recomendamos revisarlas. La información que declaramos en las secciones de privacidad de las tiendas (como la
              sección de Seguridad de los datos de Google Play y las etiquetas de privacidad de Apple) es consistente con
              este Aviso.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>12. Autoridad de protección de datos</h2>
            <p>
              Si consideras que tu derecho a la protección de datos ha sido vulnerado, puedes acudir a la autoridad competente.
              Desde las reformas de 2025, esta función corresponde a la Secretaría de Anticorrupción y Buen Gobierno del
              Gobierno Federal (en sustitución del extinto INAI).
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>13. Cambios a este Aviso</h2>
            <p>
              Podemos actualizar este Aviso para reflejar cambios legales o en nuestras prácticas. Publicaremos la versión
              vigente en https://nabbi-mobile-dev.spotynet.com/ y dentro de la app, indicando la fecha de la última
              actualización. Te recomendamos revisarlo de vez en cuando.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>14. Aceptación</h2>
            <p>
              Al usar Nabbi y proporcionar tus datos, confirmas que leíste y entendiste este Aviso de Privacidad.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
