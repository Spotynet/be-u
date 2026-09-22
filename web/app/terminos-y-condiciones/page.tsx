import type {Metadata} from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones | nabbi",
  description:
    "Términos y condiciones de uso de la plataforma nabbi. Lee nuestras políticas antes de usar el servicio.",
};

const INK = "#12211A";
const MAIN = "#558367";

export default function TerminosPage() {
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
          Términos y Condiciones de Uso — Nabbi
        </h1>
        <p style={{fontSize: 14, color: "var(--color-foreground-muted, #5A7D6A)", marginBottom: 4}}>
          Última actualización: 01 de Agosto de 2026
        </p>
        <p style={{fontSize: 14, color: "var(--color-foreground-muted, #5A7D6A)", marginBottom: 40}}>
          Vigencia a partir de: 01 de Agosto de 2026
        </p>

        <div style={{fontSize: 16, lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 32}}>
          <p>
            ¡Bienvenido a Nabbi! Estos Términos y Condiciones (los &quot;Términos&quot;) explican las reglas para usar
            nuestra app y nuestro sitio web. Léelos con calma: al usar Nabbi, aceptas estos Términos.
          </p>

          <p>
            <strong>En resumen:</strong> Nabbi es una plataforma que conecta a profesionales que ofrecen servicios con
            clientes que quieren reservarlos y pagarlos en línea. Nabbi no presta los servicios directamente; solo
            facilita el contacto, la reserva y el pago. El cobro de los pagos lo realiza un proveedor externo
            especializado (por ejemplo, Stripe), no Nabbi. Eres responsable de cómo usas la app y del contenido que
            publicas.
          </p>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>1. Aceptación de los Términos</h2>
            <p>
              Estos Términos regulan el uso de la plataforma Nabbi (la &quot;Plataforma&quot; o la &quot;app&quot;), disponible
              en la aplicación móvil (App Store y Google Play) y en el sitio web
              https://nabbi-mobile-dev.spotynet.com/, operada por Spotynet S.A. de C.V. (en adelante &quot;Nabbi&quot;,
              &quot;nosotros&quot;), con domicilio en la Calle Orizaba 154, Roma Norte, Cuauhtemoc, 06700 CDMX., RFC
              SPO190614UJ5 y correo de contacto nabbi@spotynet.com.
            </p>
            <p style={{marginTop: 12}}>
              Al registrarte o usar Nabbi, confirmas que leíste y aceptaste estos Términos y nuestro Aviso de Privacidad.
              Si no estás de acuerdo, por favor no uses la Plataforma. Tu aceptación electrónica tiene la misma validez
              que una firma, conforme al artículo 89 del Código de Comercio.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>2. Definiciones</h2>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li><strong>Plataforma / Nabbi:</strong> la app, el sitio web y las funciones que permiten publicar, buscar, reservar, contratar y pagar servicios.</li>
              <li><strong>Profesional:</strong> quien se registra para ofrecer y prestar servicios.</li>
              <li><strong>Cliente:</strong> quien busca, reserva y contrata servicios.</li>
              <li><strong>Usuario:</strong> cualquier Profesional o Cliente que usa la Plataforma.</li>
              <li><strong>Reserva:</strong> el agendamiento de un servicio entre un Cliente y un Profesional en una fecha y hora determinadas.</li>
              <li><strong>Contenido del Usuario:</strong> la información, textos, fotos, reseñas, calificaciones y publicaciones que los usuarios suben o comparten.</li>
            </ul>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>3. Qué es (y qué no es) Nabbi</h2>
            <p>
              Nabbi es una plataforma de intermediación tecnológica: conecta a Profesionales con Clientes y facilita la
              publicación de perfiles, el agendamiento de reservas, el pago en línea y la comunicación entre las partes.
              El procesamiento de los pagos lo realiza un proveedor externo de servicios de pago, Stripe; Nabbi no cobra,
              recibe ni procesa directamente los pagos.
            </p>
            <p style={{marginTop: 12}}>
              Nabbi no presta los servicios. No somos empleador, socio ni representante de los Profesionales, y no
              participamos en la ejecución de los servicios. El contrato por el servicio se celebra directamente entre el
              Cliente y el Profesional. Por eso, Nabbi no garantiza la calidad, seguridad ni resultado de los servicios
              ofrecidos, aunque trabajamos para mantener un entorno confiable.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>4. Quién puede usar Nabbi</h2>
            <p>Para usar Nabbi debes:</p>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li>Ser mayor de 18 años y tener capacidad legal para obligarte. Nabbi no está dirigida a menores.</li>
              <li>Dar información veraz, completa y actualizada al registrarte y mantenerla al día.</li>
              <li>Cuidar la confidencialidad de tu contraseña. Eres responsable de la actividad de tu cuenta y debes avisarnos de inmediato si detectas un uso no autorizado.</li>
            </ul>
            <p style={{marginTop: 12}}>
              Podemos verificar tu identidad, pedir documentación adicional y rechazar o cancelar registros que incumplan
              estos Términos.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>5. Cuentas de Profesionales</h2>
            <p>Si te registras como Profesional, te comprometes a:</p>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li>Registrarte en la categoría y con los servicios que realmente ofreces, describiéndolos de forma clara y no engañosa.</li>
              <li>Publicar precios, horarios y disponibilidad reales y mantenerlos actualizados. Los precios se expresan en pesos mexicanos (MXN) e incluyen los impuestos aplicables.</li>
              <li>Contar con los permisos, licencias, certificaciones o cédulas que la ley exija para tus servicios.</li>
              <li>Prestar los servicios con profesionalismo y en los términos ofrecidos.</li>
              <li>Emitir los comprobantes fiscales (CFDI) cuando corresponda y cumplir tus obligaciones fiscales y legales.</li>
              <li>No solicitar pagos fuera de la Plataforma para evadir comisiones o mecanismos de protección.</li>
            </ul>
            <p style={{marginTop: 12}}>
              Actúas por cuenta propia, de forma independiente. No existe relación laboral ni de subordinación con Nabbi.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>6. Cuentas de Clientes</h2>
            <p>Si usas Nabbi como Cliente, te comprometes a:</p>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li>Usar la app de buena fe y dar información veraz para tus reservas.</li>
              <li>Respetar los horarios y las políticas de cancelación de cada Profesional.</li>
              <li>Presentarte en la fecha y hora reservadas y pagar el servicio acordado.</li>
              <li>Tratar a los Profesionales con respeto, sin conductas ilícitas ni abusivas.</li>
            </ul>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>7. Perfiles y publicaciones</h2>
            <p>
              Los Profesionales pueden crear su página de perfil con servicios, precios, horarios y fotos. En la página
              principal, los usuarios también pueden crear publicaciones (&quot;posts&quot;) para darse a conocer. Eres
              responsable de la veracidad y legalidad de lo que publicas, y garantizas que tienes los derechos sobre las
              imágenes y contenidos que subes. Podemos moderar, ocultar o retirar contenido que infrinja estos Términos,
              la ley o derechos de terceros.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>8. Reservas</h2>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li>Como Cliente, reservas eligiendo al Profesional, el servicio, la fecha y la hora disponibles.</li>
              <li>La Reserva se perfecciona conforme a las políticas del Profesional y a la confirmación en la Plataforma.</li>
              <li>Te enviaremos confirmaciones y recordatorios, sin que ello implique que Nabbi preste el servicio.</li>
              <li>La disponibilidad depende de la información que carga cada Profesional; Nabbi no garantiza su exactitud.</li>
            </ul>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>9. Precios, pagos en línea y comisiones</h2>
            <p>
              La app permite pagar en línea las reservas. El procesamiento de los pagos lo realiza un proveedor externo de
              servicios de pago, actualmente Stripe, no Nabbi. Nabbi únicamente integra la tecnología de este tercero para
              facilitar la operación; no cobra, recibe ni procesa directamente los pagos.
            </p>
            <p style={{marginTop: 12}}>
              Al realizar un pago, aceptas los términos y condiciones y el aviso de privacidad del procesador de pagos
              (Stripe u otro que Nabbi habilite en el futuro). La relación de procesamiento del pago se establece entre tú
              y dicho proveedor.
            </p>
            <p style={{marginTop: 12}}>
              Nabbi no almacena los datos completos de tu tarjeta ni tus credenciales bancarias; estos son recabados y
              tratados directamente por el procesador de pagos, que cumple con estándares de seguridad de la industria
              (por ejemplo, PCI-DSS).
            </p>
            <p style={{marginTop: 12}}>
              Como los servicios se prestan y consumen en el mundo real (fuera de la app), el pago se realiza por este medio
              externo y no mediante compras dentro de la aplicación.
            </p>
            <p style={{marginTop: 12}}>
              <strong>Flujo de los fondos y pagos a Profesionales:</strong> los montos que paga el Cliente son procesados y,
              en su caso, resguardados por el procesador de pagos, quien los liquida al Profesional a través de su
              funcionalidad de marketplace o cuentas conectadas (por ejemplo, Stripe Connect). Para recibir pagos, el
              Profesional podrá estar obligado a crear y verificar una cuenta con el procesador y a aceptar sus términos.
              Nabbi no retiene ni administra directamente dichos fondos, salvo la comisión que le corresponda.
            </p>
            <p style={{marginTop: 12}}>
              Nabbi puede cobrar comisiones o cargos por el uso de la Plataforma, que se descuentan a través del procesador
              de pagos y se te informarán de forma clara antes de confirmar la operación.
            </p>
            <p style={{marginTop: 12}}>
              El precio del servicio lo fija el Profesional.
            </p>
            <p style={{marginTop: 12}}>
              Los comprobantes fiscales por los servicios son responsabilidad del Profesional. Nabbi solo factura sus
              propias comisiones o servicios.
            </p>
            <p style={{marginTop: 12}}>
              Nabbi no es responsable de fallas, retrasos, rechazos, bloqueos o cualquier otra incidencia atribuible al
              procesador de pagos o a la institución financiera del usuario, sin perjuicio de los derechos que la ley te
              otorga.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>10. Cancelaciones y reembolsos</h2>
            <p>
              Cada Profesional puede fijar sus políticas de cancelación y reprogramación, que verás antes de confirmar la
              Reserva.
            </p>
            <p style={{marginTop: 12}}>
              Los reembolsos, cuando procedan, se sujetan a esas políticas y a la ley. [Describir la política general de
              cancelaciones y reembolsos, plazos y excepciones.]
            </p>
            <p style={{marginTop: 12}}>
              Como Cliente, tienes los derechos que te otorga la Ley Federal de Protección al Consumidor (LFPC).
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>11. Reseñas, calificaciones y contenido</h2>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li>Puedes publicar posts, subir fotos y dejar reseñas y calificaciones sobre servicios que realmente contrataste.</li>
              <li>Eres responsable de tu contenido y garantizas que es veraz, que no infringe derechos de terceros y que no es ilícito, difamatorio, discriminatorio, obsceno ni engañoso.</li>
              <li>Quedan prohibidas las reseñas falsas y la manipulación de calificaciones.</li>
              <li>Podemos moderar, ocultar o eliminar contenido que infrinja estos Términos.</li>
            </ul>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>12. Licencia sobre tu contenido</h2>
            <p>
              Al publicar contenido, otorgas a Nabbi una licencia mundial, no exclusiva, gratuita y sublicenciable para
              alojar, reproducir, mostrar y promover ese contenido con el fin de operar y mejorar la Plataforma. Sigues
              siendo el titular de tus derechos; la licencia dura mientras el contenido esté publicado y por el tiempo
              razonable para respaldos y cumplimiento legal.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>13. Propiedad intelectual de Nabbi</h2>
            <p>
              El software, diseños, marcas, logotipos y demás elementos de la Plataforma son propiedad de Nabbi o de sus
              licenciantes. No puedes copiarlos, modificarlos, hacer ingeniería inversa ni explotarlos sin nuestra
              autorización por escrito.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>14. Conductas prohibidas</h2>
            <p>No está permitido:</p>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li>Usar la app con fines ilícitos o fraudulentos.</li>
              <li>Suplantar identidades o dar información falsa.</li>
              <li>Publicar contenido ilícito, ofensivo o que infrinja derechos de terceros.</li>
              <li>Operar fuera de la Plataforma para evadir comisiones o protecciones.</li>
              <li>Introducir virus o código malicioso, o dañar la seguridad de la app.</li>
              <li>Extraer datos de otros usuarios o usar bots/scraping no autorizados.</li>
              <li>Acosar, amenazar o dañar a otros usuarios.</li>
            </ul>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>15. Eliminación y cancelación de cuenta</h2>
            <p>
              Puedes eliminar tu cuenta cuando quieras: (i) desde la app, en Ajustes → Cuenta → Eliminar cuenta o (ii)
              desde la web en [https://nabbi-mobile-dev.spotynet.com/eliminar-cuenta] o escribiendo a nabbi@spotynet.com.
              El manejo de tus datos al eliminar la cuenta se detalla en el Aviso de Privacidad.
            </p>
            <p style={{marginTop: 12}}>
              Nabbi también puede suspender o cancelar tu cuenta, sin responsabilidad, si incumples estos Términos o la ley,
              das información falsa, realizas conductas fraudulentas o lo exige una autoridad.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>16. Tiendas de aplicaciones (App Store y Google Play)</h2>
            <p>
              Nabbi se descarga desde App Store (Apple) y Google Play (Google). Además de estos Términos, aplican los
              términos de uso de cada tienda. Reconoces y aceptas que:
            </p>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li>Estos Términos son un acuerdo entre tú y Nabbi, no con Apple ni con Google. Nabbi (no las tiendas) es responsable de la app y de su contenido.</li>
              <li>El soporte, mantenimiento y las reclamaciones sobre la app corresponden a Nabbi, conforme a estos Términos y a la ley aplicable. Apple y Google no tienen obligación de brindar soporte de la app.</li>
              <li>Debes usar la app conforme a las reglas de uso de la tienda desde la que la descargaste.</li>
              <li>Respecto de la app descargada en dispositivos Apple, Apple y sus subsidiarias son terceros beneficiarios de estos Términos y podrán hacerlos valer en tu contra. De igual forma, reconoces la relación aplicable con Google respecto de dispositivos Android.</li>
              <li>Las tiendas no patrocinan ni avalan la app.</li>
            </ul>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>17. Responsabilidad</h2>
            <p>En la medida que permite la ley:</p>
            <ul style={{margin: "12px 0 0 24px", display: "flex", flexDirection: "column", gap: 6}}>
              <li>Nabbi ofrece la Plataforma &quot;tal cual&quot; y &quot;según disponibilidad&quot;, sin garantizar que funcione sin interrupciones ni errores.</li>
              <li>Nabbi no es responsable de los servicios prestados por los Profesionales, que son su responsabilidad exclusiva.</li>
              <li>Nabbi no responde por daños indirectos o incidentales derivados del uso de la app, salvo dolo o negligencia grave que le sean directamente imputables.</li>
              <li>Nabbi no garantiza la veracidad del contenido publicado por los usuarios.</li>
              <li>Nada de lo anterior limita los derechos irrenunciables que la LFPC u otras leyes de orden público te reconocen.</li>
            </ul>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>18. Indemnización</h2>
            <p>
              Te comprometes a mantener a salvo a Nabbi frente a reclamaciones, daños o gastos (incluidos honorarios legales
              razonables) que deriven de tu incumplimiento de estos Términos, de la ley o de la infracción de derechos de
              terceros.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>19. Privacidad</h2>
            <p>
              El tratamiento de tus datos se rige por nuestro Aviso de Privacidad, disponible en la app y en el sitio web,
              elaborado conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares vigente.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>20. Cambios a los Términos</h2>
            <p>
              Podemos actualizar estos Términos. Publicaremos la versión vigente en la Plataforma con su fecha de
              actualización y, cuando los cambios sean importantes, te avisaremos. Si sigues usando la app después de los
              cambios, se entiende que los aceptas.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>21. Contacto</h2>
            <p>
              Para dudas, quejas o notificaciones, escríbenos a nabbi@spotynet.com o al domicilio de la cláusula 1.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>22. Ley aplicable y jurisdicción</h2>
            <p>
              Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Para su interpretación y cumplimiento,
              las partes se someten a los tribunales competentes de Ciudad de México, renunciando a cualquier otro fuero. En
              materia de consumo, la Procuraduría Federal del Consumidor (PROFECO) es competente en la vía administrativa.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
