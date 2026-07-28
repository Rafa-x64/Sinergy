import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { authService } from "./auth.service";

export const authController = {
  async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const fechaActual: Date = new Date();
      const { nombre, apellido, email, password, activo } = req.body;
      const usuarioExistente = await authService.buscarEmail(email);

      if (usuarioExistente !== null) {
        return res.status(409).json({
          status: "error",
          message: `el usuario con el correo ${email} ya existe`,
        });
      }

      const usuario = {
        nombre,
        apellido,
        email,
        password: password,
        activo: activo ?? true,
        ultimoAcceso: fechaActual,
        creadoEn: fechaActual,
        actualizadoEn: fechaActual,
      };

      const crear = await authService.crear(usuario);

      res.status(201).json({
        success: true,
        message: "Usuario creado correctamente",
        data: crear,
      });
    } catch (error) {
      next(error);
    }
  },

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const actualizaciones = req.body;
      const id = parseInt(req.params.id, 10);
      const parsedId = Number.isNaN(id) ? null : id;

      if (parsedId === null) {
        return res.status(400).json({
          status: "error",
          message: "El ID proporcionado no es válido",
        });
      }

      if (Object.keys(actualizaciones).length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Debe proporcionar al menos un campo para actualizar",
        });
      }

      const actualizado = await authService.actualizar(
        parsedId,
        actualizaciones,
      );

      return res.status(200).json({
        success: true,
        message: "Usuario actualizado correctamente",
        data: actualizado,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return res.status(404).json({
          status: "error",
          message: `El usuario con el ID ${req.params.id} no existe`,
        });
      }
      next(error);
    }
  },

  async listarTodos(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarios = await authService.obtenerTodos();
      res.status(202).json({ success: true, data: usuarios });
    } catch (error) {
      next(error);
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarios = await authService.obtenerHabilitados();
      res.status(202).json({ success: true, data: usuarios });
    } catch (error) {
      next(error);
    }
  },

  async deshabilitar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const parsedId = Number.isNaN(id) ? null : id;
      if (parsedId === null) {
        return res
          .status(400)
          .json({ status: "error", message: "id inválido" });
      }

      const yaInactivo = await authService.validarActivo(parsedId);
      if (yaInactivo) {
        return res.status(409).json({
          status: "warning",
          message: `usuario con id ${parsedId} ya fue eliminado`,
        });
      }

      const eliminado = await authService.deshabilitar(parsedId);
      if (eliminado === null) {
        return res.status(404).json({
          status: "error",
          message: `usuario con id ${parsedId} no encontrado`,
        });
      }

      return res
        .status(200)
        .json({ status: "ok", message: "usuario eliminado", data: eliminado });
    } catch (error) {
      next(error);
    }
  },
};
