--
-- PostgreSQL database dump
--

\restrict LZ7VTrbl9TBwCKKoh8Jl0aglt1XWbZk0fVfEFzM5vDEX8PXZejCwW0GNNiMKHrh

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

-- Started on 2026-08-03 16:30:22

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 23393)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 5041 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 884 (class 1247 OID 23434)
-- Name: EstadoInspeccion; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoInspeccion" AS ENUM (
    'BORRADOR',
    'PENDIENTE',
    'APROBADO',
    'RECHAZADO'
);


ALTER TYPE public."EstadoInspeccion" OWNER TO postgres;

--
-- TOC entry 875 (class 1247 OID 23404)
-- Name: EstadoOperativo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoOperativo" AS ENUM (
    'OPERATIVO',
    'INOPERATIVO',
    'EN_MANTENIMIENTO'
);


ALTER TYPE public."EstadoOperativo" OWNER TO postgres;

--
-- TOC entry 887 (class 1247 OID 23444)
-- Name: OrigenDatos; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrigenDatos" AS ENUM (
    'ONLINE',
    'OFFLINE_SYNC'
);


ALTER TYPE public."OrigenDatos" OWNER TO postgres;

--
-- TOC entry 878 (class 1247 OID 23412)
-- Name: TipoEvaluacion; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoEvaluacion" AS ENUM (
    'NUMERICO_ENTERO',
    'NUMERICO_DECIMAL',
    'TEMPERATURA',
    'SELECCION'
);


ALTER TYPE public."TipoEvaluacion" OWNER TO postgres;

--
-- TOC entry 881 (class 1247 OID 23422)
-- Name: TipoInspeccion; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoInspeccion" AS ENUM (
    'VARIABLES_CRITICAS',
    'MONTACARGAS',
    'COMPRESOR',
    'GENERADOR',
    'CHILLER'
);


ALTER TYPE public."TipoInspeccion" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 23394)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 23598)
-- Name: auditoria_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditoria_logs (
    id bigint NOT NULL,
    usuario_id integer,
    accion character varying(100) NOT NULL,
    tabla_afectada character varying(100) NOT NULL,
    registro_id bigint NOT NULL,
    datos_previos jsonb,
    datos_nuevos jsonb,
    ip_origen character varying(45),
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.auditoria_logs OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 23597)
-- Name: auditoria_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auditoria_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5043 (class 0 OID 0)
-- Dependencies: 246
-- Name: auditoria_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_logs_id_seq OWNED BY public.auditoria_logs.id;


--
-- TOC entry 235 (class 1259 OID 23535)
-- Name: componentes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.componentes (
    id integer NOT NULL,
    equipo_id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    orden_posicion integer DEFAULT 0 NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.componentes OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 23534)
-- Name: componentes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.componentes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.componentes_id_seq OWNER TO postgres;

--
-- TOC entry 5044 (class 0 OID 0)
-- Dependencies: 234
-- Name: componentes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.componentes_id_seq OWNED BY public.componentes.id;


--
-- TOC entry 229 (class 1259 OID 23505)
-- Name: equipos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipos (
    id integer NOT NULL,
    codigo character varying(100) NOT NULL,
    nombre character varying(255) NOT NULL,
    serial character varying(100),
    marca character varying(100),
    modelo character varying(100),
    estado_operativo public."EstadoOperativo" DEFAULT 'OPERATIVO'::public."EstadoOperativo" NOT NULL,
    observacion text,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    linea_id integer,
    tipo_equipo_id integer NOT NULL
);


ALTER TABLE public.equipos OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 23504)
-- Name: equipos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.equipos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.equipos_id_seq OWNER TO postgres;

--
-- TOC entry 5045 (class 0 OID 0)
-- Dependencies: 228
-- Name: equipos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.equipos_id_seq OWNED BY public.equipos.id;


--
-- TOC entry 245 (class 1259 OID 23588)
-- Name: inspeccion_adjuntos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspeccion_adjuntos (
    id bigint NOT NULL,
    inspeccion_id bigint NOT NULL,
    detalle_id bigint,
    ruta_archivo character varying(500) NOT NULL,
    nombre_archivo character varying(255) NOT NULL,
    tipo_mime character varying(100) NOT NULL,
    tamano_bytes bigint NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.inspeccion_adjuntos OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 23587)
-- Name: inspeccion_adjuntos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inspeccion_adjuntos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inspeccion_adjuntos_id_seq OWNER TO postgres;

--
-- TOC entry 5046 (class 0 OID 0)
-- Dependencies: 244
-- Name: inspeccion_adjuntos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inspeccion_adjuntos_id_seq OWNED BY public.inspeccion_adjuntos.id;


--
-- TOC entry 243 (class 1259 OID 23578)
-- Name: inspeccion_detalles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspeccion_detalles (
    id bigint NOT NULL,
    inspeccion_id bigint NOT NULL,
    variable_id integer NOT NULL,
    valor_numerico numeric(12,4),
    valor_seleccion character varying(10),
    observaciones text,
    estado_componente boolean DEFAULT true NOT NULL
);


ALTER TABLE public.inspeccion_detalles OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 23577)
-- Name: inspeccion_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inspeccion_detalles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inspeccion_detalles_id_seq OWNER TO postgres;

--
-- TOC entry 5047 (class 0 OID 0)
-- Dependencies: 242
-- Name: inspeccion_detalles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inspeccion_detalles_id_seq OWNED BY public.inspeccion_detalles.id;


--
-- TOC entry 241 (class 1259 OID 23565)
-- Name: inspecciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspecciones (
    id bigint NOT NULL,
    codigo_inspeccion character varying(100) NOT NULL,
    tipo_inspeccion public."TipoInspeccion" NOT NULL,
    equipo_id integer NOT NULL,
    elaborado_por integer NOT NULL,
    revisado_por integer,
    aprobado_por integer,
    fecha_registro timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_sincronizacion timestamp(3) without time zone,
    estado_inspeccion public."EstadoInspeccion" DEFAULT 'PENDIENTE'::public."EstadoInspeccion" NOT NULL,
    origen_datos public."OrigenDatos" DEFAULT 'ONLINE'::public."OrigenDatos" NOT NULL,
    observaciones_generales text,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.inspecciones OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 23564)
-- Name: inspecciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inspecciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inspecciones_id_seq OWNER TO postgres;

--
-- TOC entry 5048 (class 0 OID 0)
-- Dependencies: 240
-- Name: inspecciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inspecciones_id_seq OWNED BY public.inspecciones.id;


--
-- TOC entry 227 (class 1259 OID 23496)
-- Name: lineas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lineas (
    id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    nombre character varying(255) NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    ubicacion_tecnica_id integer NOT NULL
);


ALTER TABLE public.lineas OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 23495)
-- Name: lineas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lineas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lineas_id_seq OWNER TO postgres;

--
-- TOC entry 5049 (class 0 OID 0)
-- Dependencies: 226
-- Name: lineas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lineas_id_seq OWNED BY public.lineas.id;


--
-- TOC entry 233 (class 1259 OID 23525)
-- Name: montacargas_detalles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.montacargas_detalles (
    id integer NOT NULL,
    equipo_id integer NOT NULL,
    denominacion character varying(255) NOT NULL,
    tipo_montacarga character varying(100) DEFAULT 'Montacarga'::character varying NOT NULL,
    marca character varying(100) NOT NULL,
    modelo character varying(100) NOT NULL,
    identificacion_abreviada character varying(50) NOT NULL,
    ubicacion_tecnica_texto character varying(100) NOT NULL,
    denominacion_2 text
);


ALTER TABLE public.montacargas_detalles OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 23524)
-- Name: montacargas_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.montacargas_detalles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.montacargas_detalles_id_seq OWNER TO postgres;

--
-- TOC entry 5050 (class 0 OID 0)
-- Dependencies: 232
-- Name: montacargas_detalles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.montacargas_detalles_id_seq OWNED BY public.montacargas_detalles.id;


--
-- TOC entry 239 (class 1259 OID 23557)
-- Name: opciones_seleccion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.opciones_seleccion (
    id integer NOT NULL,
    variable_id integer NOT NULL,
    clave character varying(10) NOT NULL,
    etiqueta character varying(100) NOT NULL,
    orden_posicion integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.opciones_seleccion OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 23556)
-- Name: opciones_seleccion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.opciones_seleccion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.opciones_seleccion_id_seq OWNER TO postgres;

--
-- TOC entry 5051 (class 0 OID 0)
-- Dependencies: 238
-- Name: opciones_seleccion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.opciones_seleccion_id_seq OWNED BY public.opciones_seleccion.id;


--
-- TOC entry 225 (class 1259 OID 23487)
-- Name: plantas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plantas (
    id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    nombre character varying(255) NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.plantas OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 23486)
-- Name: plantas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plantas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plantas_id_seq OWNER TO postgres;

--
-- TOC entry 5052 (class 0 OID 0)
-- Dependencies: 224
-- Name: plantas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plantas_id_seq OWNED BY public.plantas.id;


--
-- TOC entry 219 (class 1259 OID 23461)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 23460)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 5053 (class 0 OID 0)
-- Dependencies: 218
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 221 (class 1259 OID 23470)
-- Name: roles_usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles_usuario (
    id integer NOT NULL,
    rol_id integer NOT NULL,
    usuario_id integer NOT NULL
);


ALTER TABLE public.roles_usuario OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 23469)
-- Name: roles_usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_usuario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_usuario_id_seq OWNER TO postgres;

--
-- TOC entry 5054 (class 0 OID 0)
-- Dependencies: 220
-- Name: roles_usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_usuario_id_seq OWNED BY public.roles_usuario.id;


--
-- TOC entry 231 (class 1259 OID 23516)
-- Name: tipos_equipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipos_equipo (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text
);


ALTER TABLE public.tipos_equipo OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 23515)
-- Name: tipos_equipo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tipos_equipo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipos_equipo_id_seq OWNER TO postgres;

--
-- TOC entry 5055 (class 0 OID 0)
-- Dependencies: 230
-- Name: tipos_equipo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipos_equipo_id_seq OWNED BY public.tipos_equipo.id;


--
-- TOC entry 223 (class 1259 OID 23477)
-- Name: ubicaciones_tecnicas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ubicaciones_tecnicas (
    id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    planta_id integer NOT NULL,
    activa boolean DEFAULT true NOT NULL
);


ALTER TABLE public.ubicaciones_tecnicas OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 23476)
-- Name: ubicaciones_tecnicas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ubicaciones_tecnicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ubicaciones_tecnicas_id_seq OWNER TO postgres;

--
-- TOC entry 5056 (class 0 OID 0)
-- Dependencies: 222
-- Name: ubicaciones_tecnicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ubicaciones_tecnicas_id_seq OWNED BY public.ubicaciones_tecnicas.id;


--
-- TOC entry 217 (class 1259 OID 23450)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    ultimo_acceso timestamp(3) without time zone,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 23449)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 5057 (class 0 OID 0)
-- Dependencies: 216
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 237 (class 1259 OID 23547)
-- Name: variables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.variables (
    id integer NOT NULL,
    componente_id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    tipo_evaluacion public."TipoEvaluacion" NOT NULL,
    unidad character varying(20),
    valor_minimo numeric(12,4),
    valor_maximo numeric(12,4),
    orden_posicion integer DEFAULT 0 NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.variables OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 23546)
-- Name: variables_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.variables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.variables_id_seq OWNER TO postgres;

--
-- TOC entry 5058 (class 0 OID 0)
-- Dependencies: 236
-- Name: variables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.variables_id_seq OWNED BY public.variables.id;


--
-- TOC entry 4769 (class 2604 OID 23601)
-- Name: auditoria_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_logs ALTER COLUMN id SET DEFAULT nextval('public.auditoria_logs_id_seq'::regclass);


--
-- TOC entry 4750 (class 2604 OID 23538)
-- Name: componentes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.componentes ALTER COLUMN id SET DEFAULT nextval('public.componentes_id_seq'::regclass);


--
-- TOC entry 4744 (class 2604 OID 23508)
-- Name: equipos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipos ALTER COLUMN id SET DEFAULT nextval('public.equipos_id_seq'::regclass);


--
-- TOC entry 4767 (class 2604 OID 23591)
-- Name: inspeccion_adjuntos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspeccion_adjuntos ALTER COLUMN id SET DEFAULT nextval('public.inspeccion_adjuntos_id_seq'::regclass);


--
-- TOC entry 4765 (class 2604 OID 23581)
-- Name: inspeccion_detalles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspeccion_detalles ALTER COLUMN id SET DEFAULT nextval('public.inspeccion_detalles_id_seq'::regclass);


--
-- TOC entry 4760 (class 2604 OID 23568)
-- Name: inspecciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspecciones ALTER COLUMN id SET DEFAULT nextval('public.inspecciones_id_seq'::regclass);


--
-- TOC entry 4741 (class 2604 OID 23499)
-- Name: lineas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lineas ALTER COLUMN id SET DEFAULT nextval('public.lineas_id_seq'::regclass);


--
-- TOC entry 4748 (class 2604 OID 23528)
-- Name: montacargas_detalles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.montacargas_detalles ALTER COLUMN id SET DEFAULT nextval('public.montacargas_detalles_id_seq'::regclass);


--
-- TOC entry 4758 (class 2604 OID 23560)
-- Name: opciones_seleccion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opciones_seleccion ALTER COLUMN id SET DEFAULT nextval('public.opciones_seleccion_id_seq'::regclass);


--
-- TOC entry 4738 (class 2604 OID 23490)
-- Name: plantas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plantas ALTER COLUMN id SET DEFAULT nextval('public.plantas_id_seq'::regclass);


--
-- TOC entry 4733 (class 2604 OID 23464)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4734 (class 2604 OID 23473)
-- Name: roles_usuario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_usuario ALTER COLUMN id SET DEFAULT nextval('public.roles_usuario_id_seq'::regclass);


--
-- TOC entry 4747 (class 2604 OID 23519)
-- Name: tipos_equipo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_equipo ALTER COLUMN id SET DEFAULT nextval('public.tipos_equipo_id_seq'::regclass);


--
-- TOC entry 4735 (class 2604 OID 23480)
-- Name: ubicaciones_tecnicas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicaciones_tecnicas ALTER COLUMN id SET DEFAULT nextval('public.ubicaciones_tecnicas_id_seq'::regclass);


--
-- TOC entry 4730 (class 2604 OID 23453)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 4754 (class 2604 OID 23550)
-- Name: variables id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.variables ALTER COLUMN id SET DEFAULT nextval('public.variables_id_seq'::regclass);


--
-- TOC entry 5003 (class 0 OID 23394)
-- Dependencies: 215
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
8322e329-364a-48a1-9f95-f8796587c458	533f64aa13cce38d28aecec65f36eae61a5a7d472330e4670ff1037eadc4bd8d	2026-07-30 09:24:14.524999-04	20260727160434_correcciones	\N	\N	2026-07-30 09:24:14.340914-04	1
9f54dbbe-6fa5-4677-b4fa-9915d4acb46c	e2214a759655fbcd7ca5830e55a9478bd51dbe412c4196b14093b66544052dca	2026-07-30 10:27:25.266718-04	20260730142725_ubicacion_tecnica_nombre_unico	\N	\N	2026-07-30 10:27:25.197329-04	1
ceca0342-9791-42be-8389-755a751a6301	b4d9ae82493d0aeeac00994561d6f4fe03cf45c65738372fe1644eca8b18cdb7	2026-07-30 14:05:43.187827-04	20260730175941_relacion_linea_ubicacion	\N	\N	2026-07-30 14:05:43.141703-04	1
244bf963-dbb2-4608-8c64-486219e8b4cb	0138518b9a7dea8cc5eb76ba535cbbf8fc89ebf0d954d966674e6c00e0298c21	2026-07-30 14:23:12.829879-04	20260730182312_relacion_actualizada_linea_ubicacion	\N	\N	2026-07-30 14:23:12.82415-04	1
\.


--
-- TOC entry 5035 (class 0 OID 23598)
-- Dependencies: 247
-- Data for Name: auditoria_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria_logs (id, usuario_id, accion, tabla_afectada, registro_id, datos_previos, datos_nuevos, ip_origen, creado_en) FROM stdin;
\.


--
-- TOC entry 5023 (class 0 OID 23535)
-- Dependencies: 235
-- Data for Name: componentes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.componentes (id, equipo_id, nombre, descripcion, activo, orden_posicion, creado_en, actualizado_en) FROM stdin;
1	1	Motor Trifasico Principal	Motor trifásico de 5HP para banda transportadora	t	3	2026-08-03 13:18:13.779	2026-08-03 13:32:05.111
\.


--
-- TOC entry 5017 (class 0 OID 23505)
-- Dependencies: 229
-- Data for Name: equipos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.equipos (id, codigo, nombre, serial, marca, modelo, estado_operativo, observacion, creado_en, actualizado_en, linea_id, tipo_equipo_id) FROM stdin;
2	EQ-MANT-002	Motor Eléctrico Auxiliar	\N	\N	\N	OPERATIVO	\N	2026-07-30 20:47:04.323	2026-07-30 20:47:04.323	\N	1
1	EQ-BOMB-001	Bomba Centrífuga Optimizada	\N	Siemens	CentriX-2000	INOPERATIVO	\N	2026-07-30 20:46:33.523	2026-07-30 20:51:10.121	\N	1
\.


--
-- TOC entry 5033 (class 0 OID 23588)
-- Dependencies: 245
-- Data for Name: inspeccion_adjuntos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspeccion_adjuntos (id, inspeccion_id, detalle_id, ruta_archivo, nombre_archivo, tipo_mime, tamano_bytes, creado_en) FROM stdin;
\.


--
-- TOC entry 5031 (class 0 OID 23578)
-- Dependencies: 243
-- Data for Name: inspeccion_detalles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspeccion_detalles (id, inspeccion_id, variable_id, valor_numerico, valor_seleccion, observaciones, estado_componente) FROM stdin;
\.


--
-- TOC entry 5029 (class 0 OID 23565)
-- Dependencies: 241
-- Data for Name: inspecciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspecciones (id, codigo_inspeccion, tipo_inspeccion, equipo_id, elaborado_por, revisado_por, aprobado_por, fecha_registro, fecha_sincronizacion, estado_inspeccion, origen_datos, observaciones_generales, creado_en, actualizado_en) FROM stdin;
\.


--
-- TOC entry 5015 (class 0 OID 23496)
-- Dependencies: 227
-- Data for Name: lineas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lineas (id, codigo, nombre, activa, creado_en, actualizado_en, ubicacion_tecnica_id) FROM stdin;
2	1000-EXT-SAUE-CP01	Línea Principal De Corte Actualizada	f	2026-07-30 18:45:04.913	2026-07-30 18:48:56.807	1
3	1000-EXT-XXXX-XXXX	Generador	t	2026-07-30 20:45:52.106	2026-07-30 20:45:52.106	1
\.


--
-- TOC entry 5021 (class 0 OID 23525)
-- Dependencies: 233
-- Data for Name: montacargas_detalles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.montacargas_detalles (id, equipo_id, denominacion, tipo_montacarga, marca, modelo, identificacion_abreviada, ubicacion_tecnica_texto, denominacion_2) FROM stdin;
\.


--
-- TOC entry 5027 (class 0 OID 23557)
-- Dependencies: 239
-- Data for Name: opciones_seleccion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.opciones_seleccion (id, variable_id, clave, etiqueta, orden_posicion) FROM stdin;
\.


--
-- TOC entry 5013 (class 0 OID 23487)
-- Dependencies: 225
-- Data for Name: plantas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plantas (id, codigo, nombre, activa, creado_en, actualizado_en) FROM stdin;
1	1000-EXT	Planta Extrusion	t	2026-07-30 13:55:31.513	2026-07-30 13:55:31.513
2	1000-INY	Planta Principal Barquisimeto Actualizada	f	2026-07-30 18:34:27.334	2026-07-30 18:36:51.452
\.


--
-- TOC entry 5007 (class 0 OID 23461)
-- Dependencies: 219
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, nombre, descripcion) FROM stdin;
1	Tecnico	
2	Supervisor	
\.


--
-- TOC entry 5009 (class 0 OID 23470)
-- Dependencies: 221
-- Data for Name: roles_usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles_usuario (id, rol_id, usuario_id) FROM stdin;
1	2	1
\.


--
-- TOC entry 5019 (class 0 OID 23516)
-- Dependencies: 231
-- Data for Name: tipos_equipo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipos_equipo (id, nombre, descripcion) FROM stdin;
1	Generador	maquina
\.


--
-- TOC entry 5011 (class 0 OID 23477)
-- Dependencies: 223
-- Data for Name: ubicaciones_tecnicas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ubicaciones_tecnicas (id, codigo, nombre, descripcion, creado_en, actualizado_en, planta_id, activa) FROM stdin;
1	1000-EXT-SAUE-CP01	Área De Extrusión Modificada	Descripción actualizada desde la api	2026-07-30 14:27:51.913	2026-07-30 14:29:45.082	1	t
3	1000-EXT-SAUD	Área D	\N	2026-07-30 18:43:47.885	2026-07-30 18:44:09.128	2	f
\.


--
-- TOC entry 5005 (class 0 OID 23450)
-- Dependencies: 217
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, apellido, email, password_hash, activo, ultimo_acceso, creado_en, actualizado_en) FROM stdin;
1	Rafael Andres	Alvarez Tortoza	1@1.com	$2b$12$OdZey2HsGUhvW2TkMVehq.kkOx2dI6TvVzZ7bw8QjZR9EpZE5.Cx6	t	2026-08-03 20:15:09.39	2026-07-30 13:43:16.601	2026-08-03 20:15:09.396
\.


--
-- TOC entry 5025 (class 0 OID 23547)
-- Dependencies: 237
-- Data for Name: variables; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.variables (id, componente_id, nombre, tipo_evaluacion, unidad, valor_minimo, valor_maximo, orden_posicion, activa, creado_en, actualizado_en) FROM stdin;
\.


--
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 246
-- Name: auditoria_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditoria_logs_id_seq', 1, false);


--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 234
-- Name: componentes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.componentes_id_seq', 3, true);


--
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 228
-- Name: equipos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.equipos_id_seq', 3, true);


--
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 244
-- Name: inspeccion_adjuntos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inspeccion_adjuntos_id_seq', 1, false);


--
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 242
-- Name: inspeccion_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inspeccion_detalles_id_seq', 1, false);


--
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 240
-- Name: inspecciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inspecciones_id_seq', 1, false);


--
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 226
-- Name: lineas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lineas_id_seq', 3, true);


--
-- TOC entry 5066 (class 0 OID 0)
-- Dependencies: 232
-- Name: montacargas_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.montacargas_detalles_id_seq', 1, false);


--
-- TOC entry 5067 (class 0 OID 0)
-- Dependencies: 238
-- Name: opciones_seleccion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.opciones_seleccion_id_seq', 1, false);


--
-- TOC entry 5068 (class 0 OID 0)
-- Dependencies: 224
-- Name: plantas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.plantas_id_seq', 2, true);


--
-- TOC entry 5069 (class 0 OID 0)
-- Dependencies: 218
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 2, true);


--
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 220
-- Name: roles_usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_usuario_id_seq', 1, true);


--
-- TOC entry 5071 (class 0 OID 0)
-- Dependencies: 230
-- Name: tipos_equipo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipos_equipo_id_seq', 1, true);


--
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 222
-- Name: ubicaciones_tecnicas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ubicaciones_tecnicas_id_seq', 3, true);


--
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 216
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 1, true);


--
-- TOC entry 5074 (class 0 OID 0)
-- Dependencies: 236
-- Name: variables_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.variables_id_seq', 1, false);


--
-- TOC entry 4772 (class 2606 OID 23402)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4838 (class 2606 OID 23606)
-- Name: auditoria_logs auditoria_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_logs
    ADD CONSTRAINT auditoria_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4810 (class 2606 OID 23545)
-- Name: componentes componentes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.componentes
    ADD CONSTRAINT componentes_pkey PRIMARY KEY (id);


--
-- TOC entry 4799 (class 2606 OID 23514)
-- Name: equipos equipos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipos
    ADD CONSTRAINT equipos_pkey PRIMARY KEY (id);


--
-- TOC entry 4835 (class 2606 OID 23596)
-- Name: inspeccion_adjuntos inspeccion_adjuntos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspeccion_adjuntos
    ADD CONSTRAINT inspeccion_adjuntos_pkey PRIMARY KEY (id);


--
-- TOC entry 4830 (class 2606 OID 23586)
-- Name: inspeccion_detalles inspeccion_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspeccion_detalles
    ADD CONSTRAINT inspeccion_detalles_pkey PRIMARY KEY (id);


--
-- TOC entry 4826 (class 2606 OID 23576)
-- Name: inspecciones inspecciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspecciones
    ADD CONSTRAINT inspecciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4793 (class 2606 OID 23503)
-- Name: lineas lineas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lineas
    ADD CONSTRAINT lineas_pkey PRIMARY KEY (id);


--
-- TOC entry 4806 (class 2606 OID 23533)
-- Name: montacargas_detalles montacargas_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.montacargas_detalles
    ADD CONSTRAINT montacargas_detalles_pkey PRIMARY KEY (id);


--
-- TOC entry 4816 (class 2606 OID 23563)
-- Name: opciones_seleccion opciones_seleccion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opciones_seleccion
    ADD CONSTRAINT opciones_seleccion_pkey PRIMARY KEY (id);


--
-- TOC entry 4790 (class 2606 OID 23494)
-- Name: plantas plantas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plantas
    ADD CONSTRAINT plantas_pkey PRIMARY KEY (id);


--
-- TOC entry 4778 (class 2606 OID 23468)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4780 (class 2606 OID 23475)
-- Name: roles_usuario roles_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_usuario
    ADD CONSTRAINT roles_usuario_pkey PRIMARY KEY (id);


--
-- TOC entry 4803 (class 2606 OID 23523)
-- Name: tipos_equipo tipos_equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_equipo
    ADD CONSTRAINT tipos_equipo_pkey PRIMARY KEY (id);


--
-- TOC entry 4785 (class 2606 OID 23485)
-- Name: ubicaciones_tecnicas ubicaciones_tecnicas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicaciones_tecnicas
    ADD CONSTRAINT ubicaciones_tecnicas_pkey PRIMARY KEY (id);


--
-- TOC entry 4775 (class 2606 OID 23459)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4813 (class 2606 OID 23555)
-- Name: variables variables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.variables
    ADD CONSTRAINT variables_pkey PRIMARY KEY (id);


--
-- TOC entry 4836 (class 1259 OID 23641)
-- Name: auditoria_logs_creado_en_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auditoria_logs_creado_en_idx ON public.auditoria_logs USING btree (creado_en);


--
-- TOC entry 4839 (class 1259 OID 23640)
-- Name: auditoria_logs_tabla_afectada_registro_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auditoria_logs_tabla_afectada_registro_id_idx ON public.auditoria_logs USING btree (tabla_afectada, registro_id);


--
-- TOC entry 4840 (class 1259 OID 23639)
-- Name: auditoria_logs_usuario_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auditoria_logs_usuario_id_idx ON public.auditoria_logs USING btree (usuario_id);


--
-- TOC entry 4807 (class 1259 OID 23623)
-- Name: componentes_activo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX componentes_activo_idx ON public.componentes USING btree (activo);


--
-- TOC entry 4808 (class 1259 OID 23622)
-- Name: componentes_equipo_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX componentes_equipo_id_idx ON public.componentes USING btree (equipo_id);


--
-- TOC entry 4795 (class 1259 OID 23616)
-- Name: equipos_codigo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX equipos_codigo_key ON public.equipos USING btree (codigo);


--
-- TOC entry 4796 (class 1259 OID 23619)
-- Name: equipos_estado_operativo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipos_estado_operativo_idx ON public.equipos USING btree (estado_operativo);


--
-- TOC entry 4797 (class 1259 OID 23617)
-- Name: equipos_linea_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipos_linea_id_idx ON public.equipos USING btree (linea_id);


--
-- TOC entry 4800 (class 1259 OID 23618)
-- Name: equipos_tipo_equipo_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipos_tipo_equipo_id_idx ON public.equipos USING btree (tipo_equipo_id);


--
-- TOC entry 4832 (class 1259 OID 23638)
-- Name: inspeccion_adjuntos_detalle_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX inspeccion_adjuntos_detalle_id_idx ON public.inspeccion_adjuntos USING btree (detalle_id);


--
-- TOC entry 4833 (class 1259 OID 23637)
-- Name: inspeccion_adjuntos_inspeccion_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX inspeccion_adjuntos_inspeccion_id_idx ON public.inspeccion_adjuntos USING btree (inspeccion_id);


--
-- TOC entry 4828 (class 1259 OID 23635)
-- Name: inspeccion_detalles_inspeccion_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX inspeccion_detalles_inspeccion_id_idx ON public.inspeccion_detalles USING btree (inspeccion_id);


--
-- TOC entry 4831 (class 1259 OID 23636)
-- Name: inspeccion_detalles_variable_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX inspeccion_detalles_variable_id_idx ON public.inspeccion_detalles USING btree (variable_id);


--
-- TOC entry 4819 (class 1259 OID 23628)
-- Name: inspecciones_codigo_inspeccion_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX inspecciones_codigo_inspeccion_key ON public.inspecciones USING btree (codigo_inspeccion);


--
-- TOC entry 4820 (class 1259 OID 23630)
-- Name: inspecciones_elaborado_por_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX inspecciones_elaborado_por_idx ON public.inspecciones USING btree (elaborado_por);


--
-- TOC entry 4821 (class 1259 OID 23629)
-- Name: inspecciones_equipo_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX inspecciones_equipo_id_idx ON public.inspecciones USING btree (equipo_id);


--
-- TOC entry 4822 (class 1259 OID 23632)
-- Name: inspecciones_estado_inspeccion_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX inspecciones_estado_inspeccion_idx ON public.inspecciones USING btree (estado_inspeccion);


--
-- TOC entry 4823 (class 1259 OID 23631)
-- Name: inspecciones_fecha_registro_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX inspecciones_fecha_registro_idx ON public.inspecciones USING btree (fecha_registro);


--
-- TOC entry 4824 (class 1259 OID 23634)
-- Name: inspecciones_origen_datos_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX inspecciones_origen_datos_idx ON public.inspecciones USING btree (origen_datos);


--
-- TOC entry 4827 (class 1259 OID 23633)
-- Name: inspecciones_tipo_inspeccion_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX inspecciones_tipo_inspeccion_idx ON public.inspecciones USING btree (tipo_inspeccion);


--
-- TOC entry 4791 (class 1259 OID 25792)
-- Name: lineas_codigo_ubicacion_tecnica_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX lineas_codigo_ubicacion_tecnica_id_key ON public.lineas USING btree (codigo, ubicacion_tecnica_id);


--
-- TOC entry 4794 (class 1259 OID 25791)
-- Name: lineas_ubicacion_tecnica_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lineas_ubicacion_tecnica_id_idx ON public.lineas USING btree (ubicacion_tecnica_id);


--
-- TOC entry 4804 (class 1259 OID 23621)
-- Name: montacargas_detalles_equipo_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX montacargas_detalles_equipo_id_key ON public.montacargas_detalles USING btree (equipo_id);


--
-- TOC entry 4817 (class 1259 OID 23627)
-- Name: opciones_seleccion_variable_id_clave_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX opciones_seleccion_variable_id_clave_key ON public.opciones_seleccion USING btree (variable_id, clave);


--
-- TOC entry 4818 (class 1259 OID 23626)
-- Name: opciones_seleccion_variable_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX opciones_seleccion_variable_id_idx ON public.opciones_seleccion USING btree (variable_id);


--
-- TOC entry 4787 (class 1259 OID 23611)
-- Name: plantas_codigo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX plantas_codigo_key ON public.plantas USING btree (codigo);


--
-- TOC entry 4788 (class 1259 OID 23612)
-- Name: plantas_nombre_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX plantas_nombre_key ON public.plantas USING btree (nombre);


--
-- TOC entry 4776 (class 1259 OID 23608)
-- Name: roles_nombre_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX roles_nombre_key ON public.roles USING btree (nombre);


--
-- TOC entry 4781 (class 1259 OID 23609)
-- Name: roles_usuario_rol_id_usuario_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX roles_usuario_rol_id_usuario_id_key ON public.roles_usuario USING btree (rol_id, usuario_id);


--
-- TOC entry 4801 (class 1259 OID 23620)
-- Name: tipos_equipo_nombre_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tipos_equipo_nombre_key ON public.tipos_equipo USING btree (nombre);


--
-- TOC entry 4782 (class 1259 OID 23610)
-- Name: ubicaciones_tecnicas_codigo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ubicaciones_tecnicas_codigo_key ON public.ubicaciones_tecnicas USING btree (codigo);


--
-- TOC entry 4783 (class 1259 OID 24407)
-- Name: ubicaciones_tecnicas_nombre_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ubicaciones_tecnicas_nombre_key ON public.ubicaciones_tecnicas USING btree (nombre);


--
-- TOC entry 4786 (class 1259 OID 24408)
-- Name: ubicaciones_tecnicas_planta_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ubicaciones_tecnicas_planta_id_idx ON public.ubicaciones_tecnicas USING btree (planta_id);


--
-- TOC entry 4773 (class 1259 OID 23607)
-- Name: usuarios_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX usuarios_email_key ON public.usuarios USING btree (email);


--
-- TOC entry 4811 (class 1259 OID 23624)
-- Name: variables_componente_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX variables_componente_id_idx ON public.variables USING btree (componente_id);


--
-- TOC entry 4814 (class 1259 OID 23625)
-- Name: variables_tipo_evaluacion_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX variables_tipo_evaluacion_idx ON public.variables USING btree (tipo_evaluacion);


--
-- TOC entry 4859 (class 2606 OID 23732)
-- Name: auditoria_logs auditoria_logs_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_logs
    ADD CONSTRAINT auditoria_logs_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4848 (class 2606 OID 23677)
-- Name: componentes componentes_equipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.componentes
    ADD CONSTRAINT componentes_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES public.equipos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4845 (class 2606 OID 23662)
-- Name: equipos equipos_linea_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipos
    ADD CONSTRAINT equipos_linea_id_fkey FOREIGN KEY (linea_id) REFERENCES public.lineas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4846 (class 2606 OID 23667)
-- Name: equipos equipos_tipo_equipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipos
    ADD CONSTRAINT equipos_tipo_equipo_id_fkey FOREIGN KEY (tipo_equipo_id) REFERENCES public.tipos_equipo(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4857 (class 2606 OID 23727)
-- Name: inspeccion_adjuntos inspeccion_adjuntos_detalle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspeccion_adjuntos
    ADD CONSTRAINT inspeccion_adjuntos_detalle_id_fkey FOREIGN KEY (detalle_id) REFERENCES public.inspeccion_detalles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4858 (class 2606 OID 23722)
-- Name: inspeccion_adjuntos inspeccion_adjuntos_inspeccion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspeccion_adjuntos
    ADD CONSTRAINT inspeccion_adjuntos_inspeccion_id_fkey FOREIGN KEY (inspeccion_id) REFERENCES public.inspecciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4855 (class 2606 OID 23712)
-- Name: inspeccion_detalles inspeccion_detalles_inspeccion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspeccion_detalles
    ADD CONSTRAINT inspeccion_detalles_inspeccion_id_fkey FOREIGN KEY (inspeccion_id) REFERENCES public.inspecciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4856 (class 2606 OID 23717)
-- Name: inspeccion_detalles inspeccion_detalles_variable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspeccion_detalles
    ADD CONSTRAINT inspeccion_detalles_variable_id_fkey FOREIGN KEY (variable_id) REFERENCES public.variables(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4851 (class 2606 OID 23707)
-- Name: inspecciones inspecciones_aprobado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspecciones
    ADD CONSTRAINT inspecciones_aprobado_por_fkey FOREIGN KEY (aprobado_por) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4852 (class 2606 OID 23697)
-- Name: inspecciones inspecciones_elaborado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspecciones
    ADD CONSTRAINT inspecciones_elaborado_por_fkey FOREIGN KEY (elaborado_por) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4853 (class 2606 OID 23692)
-- Name: inspecciones inspecciones_equipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspecciones
    ADD CONSTRAINT inspecciones_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES public.equipos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4854 (class 2606 OID 23702)
-- Name: inspecciones inspecciones_revisado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspecciones
    ADD CONSTRAINT inspecciones_revisado_por_fkey FOREIGN KEY (revisado_por) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4844 (class 2606 OID 25793)
-- Name: lineas lineas_ubicacion_tecnica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lineas
    ADD CONSTRAINT lineas_ubicacion_tecnica_id_fkey FOREIGN KEY (ubicacion_tecnica_id) REFERENCES public.ubicaciones_tecnicas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4847 (class 2606 OID 23672)
-- Name: montacargas_detalles montacargas_detalles_equipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.montacargas_detalles
    ADD CONSTRAINT montacargas_detalles_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES public.equipos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4850 (class 2606 OID 23687)
-- Name: opciones_seleccion opciones_seleccion_variable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opciones_seleccion
    ADD CONSTRAINT opciones_seleccion_variable_id_fkey FOREIGN KEY (variable_id) REFERENCES public.variables(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4841 (class 2606 OID 23642)
-- Name: roles_usuario roles_usuario_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_usuario
    ADD CONSTRAINT roles_usuario_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4842 (class 2606 OID 23647)
-- Name: roles_usuario roles_usuario_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_usuario
    ADD CONSTRAINT roles_usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4843 (class 2606 OID 24409)
-- Name: ubicaciones_tecnicas ubicaciones_tecnicas_planta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicaciones_tecnicas
    ADD CONSTRAINT ubicaciones_tecnicas_planta_id_fkey FOREIGN KEY (planta_id) REFERENCES public.plantas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4849 (class 2606 OID 23682)
-- Name: variables variables_componente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.variables
    ADD CONSTRAINT variables_componente_id_fkey FOREIGN KEY (componente_id) REFERENCES public.componentes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5042 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


-- Completed on 2026-08-03 16:30:22

--
-- PostgreSQL database dump complete
--

\unrestrict LZ7VTrbl9TBwCKKoh8Jl0aglt1XWbZk0fVfEFzM5vDEX8PXZejCwW0GNNiMKHrh

