import { collection, getDocs, query, where } from "firebase/firestore"
import { getFirestoreInstance } from "../config/firebase"


export interface BackupData {
  receitas: any[]
  despesas: any[]
  membros: any[]
  timestamp: string
  userId: string
}

export class BackupService {
  private static instance: BackupService

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService()
    }
    return BackupService.instance
  }

  async createBackup(userId: string): Promise<BackupData> {
    try {
      const db = getFirestoreInstance()

      // Buscar receitas
      const receitasQuery = query(collection(db, "receitas"), where("userId", "==", userId))
      const receitasSnapshot = await getDocs(receitasQuery)
      const receitas = receitasSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      // Buscar despesas
      const despesasQuery = query(collection(db, "despesas"), where("userId", "==", userId))
      const despesasSnapshot = await getDocs(despesasQuery)
      const despesas = despesasSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      // Buscar membros
      const membrosQuery = query(collection(db, "membros"), where("userId", "==", userId))
      const membrosSnapshot = await getDocs(membrosQuery)
      const membros = membrosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      const backupData: BackupData = {
        receitas,
        despesas,
        membros,
        timestamp: new Date().toISOString(),
        userId,
      }

      return backupData
    } catch (error) {
      console.error("Erro ao criar backup:", error)
      throw error
    }
  }

  downloadBackup(backupData: BackupData): void {
    const dataStr = JSON.stringify(backupData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `backup-igreja-${backupData.timestamp.split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async scheduleAutoBackup(userId: string, intervalHours = 24): Promise<void> {
    const performBackup = async () => {
      try {
        const backup = await this.createBackup(userId)

        // Salvar no localStorage como backup local
        const localBackups = JSON.parse(localStorage.getItem("church-backups") || "[]")
        localBackups.push({
          ...backup,
          id: Date.now().toString(),
        })

        // Manter apenas os últimos 5 backups
        if (localBackups.length > 5) {
          localBackups.splice(0, localBackups.length - 5)
        }

        localStorage.setItem("church-backups", JSON.stringify(localBackups))

        console.log("Backup automático realizado:", backup.timestamp)
      } catch (error) {
        console.error("Erro no backup automático:", error)
      }
    }

    // Executar backup inicial
    await performBackup()

    // Agendar backups periódicos
    setInterval(performBackup, intervalHours * 60 * 60 * 1000)
  }

  getLocalBackups(): BackupData[] {
    try {
      return JSON.parse(localStorage.getItem("church-backups") || "[]")
    } catch {
      return []
    }
  }

  deleteLocalBackup(backupId: string): void {
    const backups = this.getLocalBackups()
    const filteredBackups = backups.filter((backup: any) => backup.id !== backupId)
    localStorage.setItem("church-backups", JSON.stringify(filteredBackups))
  }
}

export const backupService = BackupService.getInstance()
