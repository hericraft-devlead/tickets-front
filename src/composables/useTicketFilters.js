
import { ref, computed } from 'vue'

export default function useTicketFilters(ticketsList) {
  const search = ref('')
  const selectedStatus = ref('')
  const selectedPriority = ref('')
  const selectedCategory = ref('')
  const selectedTimeRange = ref('')
  const customStartDate = ref('')
  const customEndDate = ref('')
  const sortBy = ref('created_at')
  const sortOrder = ref('desc')

  const hasActiveFilters = computed(() => {
    return search.value || selectedStatus.value || selectedPriority.value || 
          selectedCategory.value || selectedTimeRange.value
  })

  const getDateRange = () => {
    const now = new Date()
    let startDate = null
    let endDate = null

    switch (selectedTimeRange.value) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        break
      case 'yesterday':
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
        endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
        break
      case 'week':
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        break
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        break
      case 'custom':
        if (customStartDate.value && customEndDate.value) {
          startDate = new Date(customStartDate.value)
          endDate = new Date(customEndDate.value)
          endDate.setHours(23, 59, 59)
        } else if (customStartDate.value) {
          startDate = new Date(customStartDate.value)
          endDate = new Date(startDate)
          endDate.setHours(23, 59, 59)
        } else if (customEndDate.value) {
          endDate = new Date(customEndDate.value)
          endDate.setHours(23, 59, 59)
          startDate = new Date(0)
        }
        break
      default:
        return { startDate: null, endDate: null }
    }

    return { startDate, endDate }
  }

  const sortTickets = (tickets) => {
    return [...tickets].sort((a, b) => {
      let valueA, valueB
      
      switch (sortBy.value) {
        case 'title':
          valueA = a.title ? a.title.toLowerCase() : ''
          valueB = b.title ? b.title.toLowerCase() : ''
          break
        case 'priority':
          valueA = a.priority?.level || a.priority?.id || 0
          valueB = b.priority?.level || b.priority?.id || 0
          break
        case 'updated_at':
          valueA = new Date(a.updated_at || a.created_at).getTime()
          valueB = new Date(b.updated_at || b.created_at).getTime()
          break
        case 'created_at':
        default:
          valueA = new Date(a.created_at).getTime()
          valueB = new Date(b.created_at).getTime()
      }
      
      if (sortOrder.value === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0
      }
    })
  }

  const applyFilters = (tickets) => {
    let filtered = [...tickets]
    
    if (search.value.trim()) {
      const searchTerm = search.value.trim().toLowerCase()
      filtered = filtered.filter(ticket => {
        return (
          (ticket.title && ticket.title.toLowerCase().includes(searchTerm)) ||
          (ticket.description && ticket.description.toLowerCase().includes(searchTerm)) ||
          (ticket.moodle_user?.name && ticket.moodle_user.name.toLowerCase().includes(searchTerm)) ||
          (ticket.moodle_user?.email && ticket.moodle_user.email.toLowerCase().includes(searchTerm)) ||
          (ticket.assigned_user?.name && ticket.assigned_user.name.toLowerCase().includes(searchTerm)) ||
          (ticket.tags && ticket.tags.some(tag => 
            tag.name.toLowerCase().includes(searchTerm)
          )) ||
          (ticket.category?.name && ticket.category.name.toLowerCase().includes(searchTerm)) ||
          (ticket.department?.name && ticket.department.name.toLowerCase().includes(searchTerm))
        )
      })
    }
    
    if (selectedStatus.value) {
      filtered = filtered.filter(ticket => 
        ticket.status_id == selectedStatus.value || ticket.status?.id == selectedStatus.value
      )
    }
    
    if (selectedPriority.value) {
      filtered = filtered.filter(ticket => 
        ticket.priority_id == selectedPriority.value || ticket.priority?.id == selectedPriority.value
      )
    }
    
    if (selectedCategory.value) {
      filtered = filtered.filter(ticket => 
        ticket.category_id == selectedCategory.value || ticket.category?.id == selectedCategory.value
      )
    }
    
    if (selectedTimeRange.value) {
      const dateRange = getDateRange()
      if (dateRange.startDate && dateRange.endDate) {
        filtered = filtered.filter(ticket => {
          const ticketDate = new Date(ticket.created_at)
          return ticketDate >= dateRange.startDate && ticketDate <= dateRange.endDate
        })
      } else if (dateRange.startDate) {
        filtered = filtered.filter(ticket => {
          const ticketDate = new Date(ticket.created_at)
          return ticketDate >= dateRange.startDate
        })
      } else if (dateRange.endDate) {
        filtered = filtered.filter(ticket => {
          const ticketDate = new Date(ticket.created_at)
          return ticketDate <= dateRange.endDate
        })
      }
    }
    
    return sortTickets(filtered)
  }

  const clearFilters = () => {
    search.value = ''
    selectedStatus.value = ''
    selectedPriority.value = ''
    selectedCategory.value = ''
    selectedTimeRange.value = ''
    customStartDate.value = ''
    customEndDate.value = ''
    sortBy.value = 'created_at'
    sortOrder.value = 'desc'
  }

  const toggleSortOrder = () => {
    sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  }

  const sortByColumn = (column) => {
    if (sortBy.value === column) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = column
      sortOrder.value = 'asc'
    }
  }

  return {
    search,
    selectedStatus,
    selectedPriority,
    selectedCategory,
    selectedTimeRange,
    customStartDate,
    customEndDate,
    sortBy,
    sortOrder,
    
    hasActiveFilters,
    
    getDateRange,
    applyFilters,
    clearFilters,
    toggleSortOrder,
    sortByColumn
  }
}