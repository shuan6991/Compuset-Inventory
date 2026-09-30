import type {
  Equipos,
  InitialData,
  LoginResponse,
  Mantenimiento
} from "../types";

import {
  obtenerCicloActual,
  obtenerAño
} from "../utilis/cicloHelpers";

declare const google: any;


const isGoogleScriptAvailable = () => {
  return (
    typeof google !== "undefined" &&
    google.script &&
    google.script.run
  );
};



const SESSION_STORAGE_KEY = "compu_inventory_session";

export const guardarSessionId = (
  sessionId: string
): void => {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    sessionId
  );
};

export const obtenerSessionId = (): string | null => {
  return sessionStorage.getItem(
    SESSION_STORAGE_KEY
  );
};

export const eliminarSessionId = (): void => {
  sessionStorage.removeItem(
    SESSION_STORAGE_KEY
  );
};



const prepararMantenimiento = (
  data: Mantenimiento
): Mantenimiento => {

  const fechaActual = new Date();

  const año = obtenerAño(fechaActual);

  const ciclo = obtenerCicloActual(
    data.ciudad,
    fechaActual
  );


  if (ciclo === 0) {
    throw new Error(
      "La ciudad seleccionada no tiene un ciclo de mantenimiento activo en este momento."
    );
  }

  return {
    ...data,
    año,
    ciclo
  };
};



export const guardarMantenimiento = (
  data: Mantenimiento
): Promise<Mantenimiento> => {

  return new Promise((resolve, reject) => {

    try {

      if (!isGoogleScriptAvailable()) {
        reject(
          "Google Apps Script no disponible"
        );
        return;
      }

      const sessionId =
        obtenerSessionId();

      console.log(sessionId)

      if (!sessionId) {
        reject(
          "La sesión ha expirado. Inicie sesión nuevamente."
        );
        return;
      }

      const mantenimientoFinal =
        prepararMantenimiento(data);

      google.script.run
        .withSuccessHandler(
          (response: Mantenimiento) => {
            resolve(response);
          }
        )
        .withFailureHandler(
          (error: any) => {
            reject(error);
          }
        )
        .guardarMantenimiento(
          mantenimientoFinal,
          sessionId
        );

    } catch (error) {
      reject(error);
    }
  });
};

export const guardarEquipo = async(
  data: Equipos
): Promise<Equipos> => {
  return new Promise((resolve, reject) => {

    try {

      if (!isGoogleScriptAvailable()) {
        reject(
          "Google Apps Script no disponible"
        );
        return;
      }

      const sessionId =
        obtenerSessionId();

      
      if (!sessionId) {
        reject(
          "La sesión ha expirado. Inicie sesión nuevamente."
        );
        return;
      }


      google.script.run
        .withSuccessHandler(
          (response: Equipos) => {
            resolve(response);
          }
        )
        .withFailureHandler(
          (error: any) => {
            reject(error);
          }
        )
        .guardarEquipo(
          data,
          sessionId
        );

    } catch (error) {
      reject(error);
    }
  });
}

export const actualizarMantenimiento = (
  data: Mantenimiento
): Promise<any> => {

  return new Promise((resolve, reject) => {

    if (!isGoogleScriptAvailable()) {
      reject(
        "Google Apps Script no disponible"
      );
      return;
    }

    const sessionId =
      obtenerSessionId();

    if (!sessionId) {
      reject(
        "La sesión ha expirado. Inicie sesión nuevamente."
      );
      return;
    }



    if (
      !data.año ||
      data.año <= 0
    ) {
      reject(
        "El mantenimiento no tiene un año válido."
      );
      return;
    }

    if (
      !data.ciclo ||
      data.ciclo <= 0
    ) {
      reject(
        "El mantenimiento no tiene un ciclo válido."
      );
      return;
    }

    google.script.run
      .withSuccessHandler(
        (response: any) => {
          resolve(response);
        }
      )
      .withFailureHandler(
        (error: any) => {
          reject(error);
        }
      )
      .actualizarMantenimiento(
        data,
        sessionId
      );
  });
};



export const eliminarMantenimiento = (
  idActivo: Mantenimiento["activo"],
  año: Mantenimiento["año"],
  ciclo: Mantenimiento["ciclo"]
): Promise<any> => {

  return new Promise((resolve, reject) => {

    if (!isGoogleScriptAvailable()) {
      reject(
        "Google Apps Script no disponible"
      );
      return;
    }

    const sessionId =
      obtenerSessionId();

    if (!sessionId) {
      reject(
        "La sesión ha expirado. Inicie sesión nuevamente."
      );
      return;
    }

    if (!idActivo) {
      reject(
        "El mantenimiento no tiene un activo válido."
      );
      return;
    }

    if (!año || año <= 0) {
      reject(
        "El mantenimiento no tiene un año válido."
      );
      return;
    }

    if (!ciclo || ciclo <= 0) {
      reject(
        "El mantenimiento no tiene un ciclo válido."
      );
      return;
    }

    google.script.run
      .withSuccessHandler(
        (response: any) => {
          resolve(response);
        }
      )
      .withFailureHandler(
        (error: any) => {
          reject(error);
        }
      )
      .eliminarMantenimiento(
        idActivo,
        año,
        ciclo,
        sessionId
      );
  });
};



export const obtenerTodo =
  async (): Promise<InitialData> => {

    return new Promise((resolve, reject) => {

      if (!isGoogleScriptAvailable()) {

        console.warn(
          "Modo desarrollo local"
        );

        resolve({
          marca: [],
          tecnicos: [],
          ciudad: [],
          novedades: [],
          tipo: [],
          mantenimiento: [],
          cantidadEquipos: 0,
          equipos: []
        });

        return;
      }

      const sessionId =
        obtenerSessionId();

      if (!sessionId) {
        reject(
          "La sesión ha expirado. Inicie sesión nuevamente."
        );
        return;
      }

      google.script.run
        .withSuccessHandler(
          (response: string) => {

            try {

              const data =
                JSON.parse(response);

              resolve(data);

            } catch (error) {

              reject(
                new Error(
                  "La respuesta de Google Apps Script no tiene un formato válido."
                )
              );
            }
          }
        )
        .withFailureHandler(
          (error: any) => {
            reject(error);
          }
        )
        .obtenerTodoInitialData(
          sessionId
        );
    });
  };

/**
 * ============================================================
 * OBTENER ACTIVO
 * ============================================================
 */

export const obtenerActivo = async (
  idActivo: Equipos["activo"]
): Promise<Equipos> => {

  return new Promise((resolve, reject) => {

    if (!isGoogleScriptAvailable()) {
      reject(
        "Google Apps Script no disponible"
      );
      return;
    }

    const sessionId =
      obtenerSessionId();

    if (!sessionId) {
      reject(
        "La sesión ha expirado. Inicie sesión nuevamente."
      );
      return;
    }

    google.script.run
      .withSuccessHandler(
        (response: string) => {

          try {

            const data =
              response
                ? JSON.parse(response)
                : null;

            resolve(data);

          } catch (error) {

            reject(
              new Error(
                "La respuesta del equipo no tiene un formato válido."
              )
            );
          }
        }
      )
      .withFailureHandler(
        (error: any) => {
          reject(error);
        }
      )
      .obtenerActivo(
        idActivo,
        sessionId
      );
  });
};

/**
 * ============================================================
 * LOGIN
 * ============================================================
 *
 * El login NO necesita sessionId porque precisamente
 * este proceso es el que crea la sesión.
 */

export const validarLogin = (
  usuario: string,
  contraseña: string
): Promise<LoginResponse> => {

  return new Promise((resolve, reject) => {

    if (!isGoogleScriptAvailable()) {
      reject(
        "Google Apps Script no disponible"
      );
      return;
    }

    google.script.run
      .withSuccessHandler(
        (response: LoginResponse) => {

          /**
           * Si Apps Script devuelve una sesión,
           * la guardamos inmediatamente.
           */

          if (
            response &&
            (response as any).sessionId
          ) {

            guardarSessionId(
              (response as any).sessionId
            );
          }

          resolve(response);
        }
      )
      .withFailureHandler(
        (error: any) => {
          reject(error);
        }
      )
      .validarLogin(
        usuario,
        contraseña
      );
  });
};

/**
 * ============================================================
 * CERRAR SESIÓN
 * ============================================================
 */

export const cerrarSesion = (): Promise<any> => {

  return new Promise((resolve, reject) => {

    if (!isGoogleScriptAvailable()) {

      eliminarSessionId();

      resolve({
        success: true
      });

      return;
    }

    const sessionId =
      obtenerSessionId();

    /**
     * Si no existe sesión local,
     * simplemente limpiamos el navegador.
     */

    if (!sessionId) {

      eliminarSessionId();

      resolve({
        success: true
      });

      return;
    }

    google.script.run
      .withSuccessHandler(
        (response: any) => {

          eliminarSessionId();

          resolve(response);
        }
      )
      .withFailureHandler(
        (error: any) => {

          /**
           * Aunque falle la comunicación con Apps Script,
           * eliminamos la sesión local.
           */

          eliminarSessionId();

          reject(error);
        }
      )
      .cerrarSesion(
        sessionId
      );
  });
};

/**
 * ============================================================
 * RECUPERACIÓN DE CONTRASEÑA
 * ============================================================
 *
 * Estas funciones no utilizan sessionId porque el usuario
 * todavía no está autenticado.
 */

/**
 * Solicita un código de recuperación.
 */

export const solicitarCodigoRecuperacion = (
  correo: string
): Promise<{
  success: boolean;
  message: string;
}> => {

  return new Promise((resolve, reject) => {

    if (!isGoogleScriptAvailable()) {
      reject(
        "Google Apps Script no disponible"
      );
      return;
    }

    google.script.run
      .withSuccessHandler(
        (
          response: {
            success: boolean;
            message: string;
          }
        ) => {

          resolve(response);
        }
      )
      .withFailureHandler(
        (error: any) => {
          reject(error);
        }
      )
      .solicitarCodigoRecuperacion(
        correo
      );
  });
};

/**
 * Valida el código de recuperación.
 */

export const validarCodigoRecuperacion = (
  correo: string,
  codigo: string
): Promise<{
  success: boolean;
  message: string;
}> => {

  return new Promise((resolve, reject) => {

    if (!isGoogleScriptAvailable()) {
      reject(
        "Google Apps Script no disponible"
      );
      return;
    }

    google.script.run
      .withSuccessHandler(
        (
          response: {
            success: boolean;
            message: string;
          }
        ) => {

          resolve(response);
        }
      )
      .withFailureHandler(
        (error: any) => {
          reject(error);
        }
      )
      .validarCodigoRecuperacion(
        correo,
        codigo
      );
  });
};

/**
 * Cambia la contraseña del usuario.
 */

export const cambiarContraseña = (
  correo: string,
  codigo: string,
  nuevaContraseña: string
): Promise<{
  success: boolean;
  message: string;
}> => {

  return new Promise((resolve, reject) => {

    if (!isGoogleScriptAvailable()) {
      reject(
        "Google Apps Script no disponible"
      );
      return;
    }

    google.script.run
      .withSuccessHandler(
        (
          response: {
            success: boolean;
            message: string;
          }
        ) => {

          resolve(response);
        }
      )
      .withFailureHandler(
        (error: any) => {
          reject(error);
        }
      )
      .cambiarContraseña(
        correo,
        codigo,
        nuevaContraseña
      );
  });
};

