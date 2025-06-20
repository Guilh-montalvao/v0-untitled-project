import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Tipo para operações do banco de dados
type DataOperation<T> = {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: T | null;
};

// Hook principal para o Supabase
export const useSupabase = () => {
  // Quartos
  const useRooms = () => {
    const [state, setState] = useState<DataOperation<any[]>>({
      isLoading: true,
      isError: false,
      error: null,
      data: null,
    });

    useEffect(() => {
      const fetchRooms = async () => {
        try {
          const { data, error } = await supabase.from("rooms").select("*");

          if (error) throw error;

          setState({
            isLoading: false,
            isError: false,
            error: null,
            data,
          });
        } catch (error: any) {
          setState({
            isLoading: false,
            isError: true,
            error,
            data: null,
          });
          console.error("Erro ao buscar quartos:", error);
          toast.error("Erro ao carregar quartos");
        }
      };

      fetchRooms();
    }, []);

    const addRoom = async (roomData: any) => {
      try {
        const { data, error } = await supabase
          .from("rooms")
          .insert([roomData])
          .select();

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          data: prev.data ? [data[0], ...prev.data] : [data[0]],
        }));

        toast.success("Quarto adicionado com sucesso");
        return data[0];
      } catch (error: any) {
        console.error("Erro ao adicionar quarto:", error);
        toast.error("Erro ao adicionar quarto");
        throw error;
      }
    };

    const updateRoom = async (id: string, updates: any) => {
      try {
        const { data, error } = await supabase
          .from("rooms")
          .update(updates)
          .eq("id", id)
          .select();

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          data: prev.data
            ? prev.data.map((room) => (room.id === id ? data[0] : room))
            : prev.data,
        }));

        toast.success("Quarto atualizado com sucesso");
        return data[0];
      } catch (error: any) {
        console.error("Erro ao atualizar quarto:", error);
        toast.error("Erro ao atualizar quarto");
        throw error;
      }
    };

    const deleteRoom = async (id: string) => {
      try {
        const { error } = await supabase.from("rooms").delete().eq("id", id);

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          data: prev.data
            ? prev.data.filter((room) => room.id !== id)
            : prev.data,
        }));

        toast.success("Quarto excluído com sucesso");
      } catch (error: any) {
        console.error("Erro ao excluir quarto:", error);
        toast.error("Erro ao excluir quarto");
        throw error;
      }
    };

    return {
      ...state,
      addRoom,
      updateRoom,
      deleteRoom,
    };
  };

  // Hóspedes
  const useGuests = () => {
    const [state, setState] = useState<DataOperation<any[]>>({
      isLoading: true,
      isError: false,
      error: null,
      data: null,
    });

    useEffect(() => {
      const fetchGuests = async () => {
        try {
          const { data, error } = await supabase.from("guests").select("*");

          if (error) throw error;

          setState({
            isLoading: false,
            isError: false,
            error: null,
            data,
          });
        } catch (error: any) {
          setState({
            isLoading: false,
            isError: true,
            error,
            data: null,
          });
          console.error("Erro ao buscar hóspedes:", error);
          toast.error("Erro ao carregar hóspedes");
        }
      };

      fetchGuests();
    }, []);

    const addGuest = async (guestData: any) => {
      console.log("Iniciando adição de hóspede com dados:", guestData);

      try {
        // Verificar conexão com o Supabase
        console.log("Verificando conexão com o Supabase...");
        const { data: testData, error: testError } = await supabase
          .from("guests")
          .select("count");

        if (testError) {
          console.error("Erro na conexão com o Supabase:", testError);
          throw new Error(
            `Falha na conexão com o banco de dados: ${testError.message}`
          );
        }

        console.log("Conexão com o Supabase OK, enviando dados...");

        // Validar dados obrigatórios
        if (!guestData.name || !guestData.email) {
          throw new Error(
            "Dados obrigatórios faltando: nome e email são necessários"
          );
        }

        const { data, error } = await supabase
          .from("guests")
          .insert([guestData])
          .select();

        if (error) throw error;

        console.log("Hóspede adicionado com sucesso:", data[0]);

        setState((prev) => ({
          ...prev,
          data: prev.data ? [data[0], ...prev.data] : [data[0]],
        }));

        toast.success("Hóspede adicionado com sucesso");
        return data[0];
      } catch (error: any) {
        console.error("Erro ao adicionar hóspede:", error);
        console.error("Detalhes adicionais do erro:", {
          mensagem: error.message || "Sem mensagem",
          código: error.code || "Sem código",
          detalhe: error.details || "Sem detalhes",
          dica: error.hint || "Sem dica",
          status: error.status || "Sem status",

          credenciaisPresentes:
            !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
            !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          objeto_completo: JSON.stringify(error, null, 2),
        });

        // Mostrar mensagem mais específica
        let mensagemErro = "Erro desconhecido";

        if (error.message?.includes("duplicate")) {
          mensagemErro = "Este hóspede já existe (email ou CPF duplicado)";
        } else if (error.message?.includes("violates")) {
          mensagemErro = "Dados inválidos: violação de regras do banco";
        } else if (error.message?.includes("conexão")) {
          mensagemErro = "Problema de conexão com o banco de dados";
        } else if (error.code === "PGRST301") {
          mensagemErro = "Banco de dados não configurado corretamente";
        } else if (error.status >= 400 && error.status < 500) {
          mensagemErro = "Erro de cliente (requisição inválida)";
        } else if (error.status >= 500) {
          mensagemErro = "Erro de servidor (problema interno do Supabase)";
        }

        toast.error(`Erro ao adicionar hóspede: ${mensagemErro}`);
        throw error;
      }
    };

    const updateGuest = async (id: string, updates: any) => {
      try {
        const { data, error } = await supabase
          .from("guests")
          .update(updates)
          .eq("id", id)
          .select();

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          data: prev.data
            ? prev.data.map((guest) => (guest.id === id ? data[0] : guest))
            : prev.data,
        }));

        toast.success("Hóspede atualizado com sucesso");
        return data[0];
      } catch (error: any) {
        console.error("Erro ao atualizar hóspede:", error);
        toast.error("Erro ao atualizar hóspede");
        throw error;
      }
    };

    const deleteGuest = async (id: string) => {
      try {
        const { error } = await supabase.from("guests").delete().eq("id", id);

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          data: prev.data
            ? prev.data.filter((guest) => guest.id !== id)
            : prev.data,
        }));

        toast.success("Hóspede excluído com sucesso");
      } catch (error: any) {
        console.error("Erro ao excluir hóspede:", error);
        toast.error("Erro ao excluir hóspede");
        throw error;
      }
    };

    return {
      ...state,
      addGuest,
      updateGuest,
      deleteGuest,
    };
  };

  // Reservas
  const useBookings = () => {
    const [state, setState] = useState<DataOperation<any[]>>({
      isLoading: true,
      isError: false,
      error: null,
      data: null,
    });

    useEffect(() => {
      const fetchBookings = async () => {
        try {
          const { data, error } = await supabase.from("bookings").select(`
              *,
              guests (id, name, email, phone),
              rooms (id, number, type, status, rate)
            `);

          if (error) throw error;

          setState({
            isLoading: false,
            isError: false,
            error: null,
            data,
          });
        } catch (error: any) {
          setState({
            isLoading: false,
            isError: true,
            error,
            data: null,
          });
          console.error("Erro ao buscar reservas:", error);
          toast.error("Erro ao carregar reservas");
        }
      };

      fetchBookings();
    }, []);

    const addBooking = async (bookingData: any) => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .insert([bookingData]).select(`
          *,
          guests (id, name, email, phone),
          rooms (id, number, type, status, rate)
        `);

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          data: prev.data ? [data[0], ...prev.data] : [data[0]],
        }));

        toast.success("Reserva adicionada com sucesso");
        return data[0];
      } catch (error: any) {
        console.error("Erro ao adicionar reserva:", error);
        toast.error("Erro ao adicionar reserva");
        throw error;
      }
    };

    const updateBooking = async (id: string, updates: any) => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .update(updates)
          .eq("id", id).select(`
            *,
            guests (id, name, email, phone),
            rooms (id, number, type, status, rate)
          `);

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          data: prev.data
            ? prev.data.map((booking) =>
                booking.id === id ? data[0] : booking
              )
            : prev.data,
        }));

        toast.success("Reserva atualizada com sucesso");
        return data[0];
      } catch (error: any) {
        console.error("Erro ao atualizar reserva:", error);
        toast.error("Erro ao atualizar reserva");
        throw error;
      }
    };

    const deleteBooking = async (id: string) => {
      try {
        const { error } = await supabase.from("bookings").delete().eq("id", id);

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          data: prev.data
            ? prev.data.filter((booking) => booking.id !== id)
            : prev.data,
        }));

        toast.success("Reserva cancelada com sucesso");
      } catch (error: any) {
        console.error("Erro ao cancelar reserva:", error);
        toast.error("Erro ao cancelar reserva");
        throw error;
      }
    };

    // Verificar disponibilidade de quarto
    const checkRoomAvailability = async (
      roomId: string,
      checkIn: string,
      checkOut: string
    ) => {
      try {
        const { data, error } = await supabase.rpc("check_room_availability", {
          room_id: roomId,
          check_in_date: checkIn,
          check_out_date: checkOut,
        });

        if (error) throw error;

        return data; // boolean
      } catch (error: any) {
        console.error("Erro ao verificar disponibilidade:", error);
        toast.error("Erro ao verificar disponibilidade do quarto");
        throw error;
      }
    };

    // Calcular valor total da reserva
    const calculateBookingTotal = async (
      roomId: string,
      checkIn: string,
      checkOut: string
    ) => {
      try {
        const { data, error } = await supabase.rpc("calculate_booking_total", {
          room_id: roomId,
          check_in_date: checkIn,
          check_out_date: checkOut,
        });

        if (error) throw error;

        return data; // valor decimal
      } catch (error: any) {
        console.error("Erro ao calcular valor da reserva:", error);
        toast.error("Erro ao calcular valor da reserva");
        throw error;
      }
    };

    return {
      ...state,
      addBooking,
      updateBooking,
      deleteBooking,
      checkRoomAvailability,
      calculateBookingTotal,
    };
  };

  // Pagamentos
  const usePayments = () => {
    const [state, setState] = useState<DataOperation<any[]>>({
      isLoading: true,
      isError: false,
      error: null,
      data: null,
    });

    useEffect(() => {
      const fetchPayments = async () => {
        try {
          const { data, error } = await supabase.from("payments").select(`
              *,
              bookings (id, check_in, check_out, total_amount, guests (name, email), rooms (number, type))
            `);

          if (error) throw error;

          setState({
            isLoading: false,
            isError: false,
            error: null,
            data,
          });
        } catch (error: any) {
          setState({
            isLoading: false,
            isError: true,
            error,
            data: null,
          });
          console.error("Erro ao buscar pagamentos:", error);
          toast.error("Erro ao carregar pagamentos");
        }
      };

      fetchPayments();
    }, []);

    const addPayment = async (paymentData: any) => {
      try {
        const { data, error } = await supabase
          .from("payments")
          .insert([paymentData]).select(`
          *,
          bookings (id, check_in, check_out, total_amount, guests (name, email), rooms (number, type))
        `);

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          data: prev.data ? [data[0], ...prev.data] : [data[0]],
        }));

        toast.success("Pagamento registrado com sucesso");
        return data[0];
      } catch (error: any) {
        console.error("Erro ao registrar pagamento:", error);
        toast.error("Erro ao registrar pagamento");
        throw error;
      }
    };

    const updatePaymentStatus = async (id: string, status: string) => {
      try {
        const { data, error } = await supabase
          .from("payments")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", id).select(`
            *,
            bookings (id, check_in, check_out, total_amount, guests (name, email), rooms (number, type))
          `);

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          data: prev.data
            ? prev.data.map((payment) =>
                payment.id === id ? data[0] : payment
              )
            : prev.data,
        }));

        toast.success("Status do pagamento atualizado");
        return data[0];
      } catch (error: any) {
        console.error("Erro ao atualizar status do pagamento:", error);
        toast.error("Erro ao atualizar status do pagamento");
        throw error;
      }
    };

    const deletePayment = async (id: string) => {
      try {
        const { error } = await supabase.from("payments").delete().eq("id", id);

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          data: prev.data
            ? prev.data.filter((payment) => payment.id !== id)
            : prev.data,
        }));

        toast.success("Pagamento excluído com sucesso");
      } catch (error: any) {
        console.error("Erro ao excluir pagamento:", error);
        toast.error("Erro ao excluir pagamento");
        throw error;
      }
    };

    return {
      ...state,
      addPayment,
      updatePaymentStatus,
      deletePayment,
    };
  };

  return {
    useRooms,
    useGuests,
    useBookings,
    usePayments,
  };
};
