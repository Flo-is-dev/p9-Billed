// src/__tests__/NewBill.test.js

/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";

import { ROUTES_PATH } from "../constants/routes.js";

describe("Étant donné que je suis connecté en tant qu'employé", () => {
  describe("Quand je suis sur la page NewBill", () => {
    test("Alors le formulaire NewBill doit être rendu", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });

    // Test pour le téléchargement d'un fichier avec le bon format
    describe("Lorsque je télécharge un fichier avec le bon format", () => {
      test("il devrait enregistrer l'email de l'utilisateur", async () => {
        const createMock = jest
          .fn()
          .mockResolvedValue({ fileUrl: "fileURL", key: "key" });
        const goodFormatFile = new File(["img"], "image.png", {
          type: "image/png",
        });

        const documentMock = {
          querySelector: (selector) => {
            if (selector === 'input[data-testid="file"]') {
              return {
                files: [goodFormatFile],
                addEventListener: jest.fn(),
              };
            } else {
              return { addEventListener: jest.fn() };
            }
          },
        };

        localStorage.setItem("user", '{"email" : "user@email.com"}');

        const storeMock = {
          bills: () => ({
            create: createMock,
          }),
        };

        const objInstance = new NewBill({
          document: documentMock,
          onNavigate: {},
          store: storeMock,
          localStorage: window.localStorage,
        });

        await objInstance.handleChangeFile({
          preventDefault: jest.fn(),
          target: { value: "image.png" },
        });

        const expectedEmail = "user@email.com";

        const formData = createMock.mock.calls[0][0].data;

        expect(formData.get("email")).toEqual(expectedEmail);
      });
    });

    // Test pour le téléchargement d'un fichier avec un format incorrect
    describe("Lorsque je télécharge un fichier avec un format incorrect", () => {
      beforeEach(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
      });

      afterEach(() => {
        console.error.mockRestore();
        jest.restoreAllMocks();
      });

      test("il ne devrait pas enregistrer le fichier et afficher une erreur", () => {
        const badFormatFile = new File(["doc"], "document.pdf", {
          type: "application/pdf",
        });

        const documentMock = {
          querySelector: (selector) => {
            if (selector === 'input[data-testid="file"]') {
              return {
                files: [badFormatFile],
                addEventListener: jest.fn(),
              };
            } else {
              return { addEventListener: jest.fn() };
            }
          },
        };

        const storeMock = {
          bills: () => ({
            create: jest.fn(),
          }),
        };

        const objInstance = new NewBill({
          document: documentMock,
          onNavigate: jest.fn(),
          store: storeMock,
          localStorage: {},
        });

        // Simule l'appel à handleChangeFile avec un mauvais format
        objInstance.handleChangeFile({
          preventDefault: jest.fn(),
          target: { value: "document.pdf" },
        });

        // Vérifie que la méthode create n'est pas appelée
        expect(storeMock.bills().create).not.toHaveBeenCalled();

        // Vérifie que l'erreur est bien affichée avec le bon message
        expect(console.error).toHaveBeenCalledWith(
          "Seuls les fichiers jpg, jpeg ou png sont autorisés."
        );
      });
    });

    // Test pour la soumission du formulaire avec des données valides
    describe("Lorsque je soumets le formulaire avec des données valides", () => {
      test("il devrait mettre à jour la note de frais et naviguer vers la page Bills", async () => {
        const updateMock = jest.fn().mockResolvedValue({});

        const storeMock = {
          bills: () => ({
            update: updateMock,
          }),
        };

        const onNavigate = jest.fn();

        const documentMock = {
          querySelector: jest.fn((selector) => {
            switch (selector) {
              case 'input[data-testid="datepicker"]':
                return { value: "2023-09-20", addEventListener: jest.fn() };
              case 'select[data-testid="expense-type"]':
                return { value: "Transports", addEventListener: jest.fn() };
              case 'input[data-testid="expense-name"]':
                return { value: "Taxi", addEventListener: jest.fn() };
              case 'input[data-testid="amount"]':
                return { value: "100", addEventListener: jest.fn() };
              case 'input[data-testid="vat"]':
                return { value: "20", addEventListener: jest.fn() };
              case 'input[data-testid="pct"]':
                return { value: "10", addEventListener: jest.fn() };
              case 'textarea[data-testid="commentary"]':
                return {
                  value: "Déplacement professionnel",
                  addEventListener: jest.fn(),
                };
              case 'input[data-testid="file"]':
                return {
                  files: [{ name: "receipt.png" }],
                  addEventListener: jest.fn(),
                };
              default:
                return { addEventListener: jest.fn() };
            }
          }),
        };

        localStorage.setItem(
          "user",
          JSON.stringify({ email: "user@test.com" })
        );

        const newBill = new NewBill({
          document: documentMock,
          onNavigate,
          store: storeMock,
          localStorage: window.localStorage,
        });

        newBill.billId = "12345";
        newBill.fileUrl = "http://localhost/image.png";
        newBill.fileName = "image.png";

        const updateBillSpy = jest.spyOn(newBill, "updateBill");

        await newBill.handleSubmit({
          preventDefault: jest.fn(),
          target: documentMock,
        });

        expect(updateBillSpy).toHaveBeenCalled();

        expect(updateMock).toHaveBeenCalled();

        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
      });
    });

    // Tests pour les erreurs 404 et 500 lors de la création d'un fichier
    describe("Lorsque le backend renvoie une erreur 404 lors de la création d'un fichier", () => {
      beforeEach(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
      });

      afterEach(() => {
        console.error.mockRestore();
        jest.restoreAllMocks();
      });

      test("il devrait afficher une erreur dans la console", async () => {
        const createMock = jest.fn().mockRejectedValue(new Error("Erreur 404"));

        const goodFormatFile = new File(["img"], "image.png", {
          type: "image/png",
        });

        const documentMock = {
          querySelector: (selector) => {
            if (selector === 'input[data-testid="file"]') {
              return {
                files: [goodFormatFile],
                addEventListener: jest.fn(),
              };
            } else {
              return { addEventListener: jest.fn() };
            }
          },
        };

        localStorage.setItem("user", '{"email" : "user@email.com"}');

        const storeMock = {
          bills: () => ({
            create: createMock,
          }),
        };

        const objInstance = new NewBill({
          document: documentMock,
          onNavigate: jest.fn(),
          store: storeMock,
          localStorage: window.localStorage,
        });

        await objInstance.handleChangeFile({
          preventDefault: jest.fn(),
          target: { value: "image.png" },
        });

        await waitFor(() => {
          expect(console.error).toHaveBeenCalledWith(new Error("Erreur 404"));
        });
      });
    });

    describe("Lorsque le backend renvoie une erreur 500 lors de la création d'un fichier", () => {
      beforeEach(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
      });

      afterEach(() => {
        console.error.mockRestore();
        jest.restoreAllMocks();
      });

      test("il devrait afficher une erreur dans la console", async () => {
        const createMock = jest.fn().mockRejectedValue(new Error("Erreur 500"));

        const goodFormatFile = new File(["img"], "image.png", {
          type: "image/png",
        });

        const documentMock = {
          querySelector: (selector) => {
            if (selector === 'input[data-testid="file"]') {
              return {
                files: [goodFormatFile],
                addEventListener: jest.fn(),
              };
            } else {
              return { addEventListener: jest.fn() };
            }
          },
        };

        localStorage.setItem("user", '{"email" : "user@email.com"}');

        const storeMock = {
          bills: () => ({
            create: createMock,
          }),
        };

        const objInstance = new NewBill({
          document: documentMock,
          onNavigate: jest.fn(),
          store: storeMock,
          localStorage: window.localStorage,
        });

        await objInstance.handleChangeFile({
          preventDefault: jest.fn(),
          target: { value: "image.png" },
        });

        await waitFor(() => {
          expect(console.error).toHaveBeenCalledWith(new Error("Erreur 500"));
        });
      });
    });

    // Tests pour les erreurs 404 et 500 lors de la mise à jour de la note de frais
    describe("Lorsque le backend renvoie une erreur 404 lors de la mise à jour de la note de frais", () => {
      beforeEach(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
      });

      afterEach(() => {
        console.error.mockRestore();
        jest.restoreAllMocks();
      });

      test("il devrait afficher une erreur dans la console", async () => {
        const updateMock = jest.fn().mockRejectedValue(new Error("Erreur 404"));

        const storeMock = {
          bills: () => ({
            update: updateMock,
          }),
        };

        const onNavigate = jest.fn();

        const documentMock = {
          querySelector: jest.fn((selector) => {
            return { addEventListener: jest.fn() };
          }),
        };

        const newBill = new NewBill({
          document: documentMock,
          onNavigate,
          store: storeMock,
          localStorage: window.localStorage,
        });

        await newBill.updateBill({});

        await waitFor(() => {
          expect(console.error).toHaveBeenCalledWith(new Error("Erreur 404"));
        });
      });
    });

    describe("Lorsque le backend renvoie une erreur 500 lors de la mise à jour de la note de frais", () => {
      beforeEach(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
      });

      afterEach(() => {
        console.error.mockRestore();
        jest.restoreAllMocks();
      });

      test("il devrait afficher une erreur dans la console", async () => {
        const updateMock = jest.fn().mockRejectedValue(new Error("Erreur 500"));

        const storeMock = {
          bills: () => ({
            update: updateMock,
          }),
        };

        const onNavigate = jest.fn();

        const documentMock = {
          querySelector: jest.fn((selector) => {
            return { addEventListener: jest.fn() };
          }),
        };

        const newBill = new NewBill({
          document: documentMock,
          onNavigate,
          store: storeMock,
          localStorage: window.localStorage,
        });

        await newBill.updateBill({});

        await waitFor(() => {
          expect(console.error).toHaveBeenCalledWith(new Error("Erreur 500"));
        });
      });
    });
  });
});
