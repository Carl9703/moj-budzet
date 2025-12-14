
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authorizedFetch } from '@/lib/api/client'
import { useToast } from '@/components/ui/feedback/Toast'
import { EXPENSE_CATEGORIES } from '@/lib/constants/categories'

export interface Category {
    id: string
    name: string
    icon: string
    type: 'monthly' | 'yearly'
    defaultEnvelope: string | null
}

interface CategoryContextType {
    categories: Category[]
    loading: boolean
    refreshCategories: () => Promise<void>
    getCategoryName: (id: string) => string
    getCategoryIcon: (id: string) => string
    getCategoryById: (id: string) => Category | undefined
    getCategoriesForEnvelope: (envelopeName: string) => Category[]
    addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>
    updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
    deleteCategory: (id: string) => Promise<void>
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined)

export function CategoryProvider({ children }: { children: React.ReactNode }) {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const { showToast } = useToast()

    const fetchCategories = async () => {
        try {
            const res = await authorizedFetch('/api/categories')
            if (res.ok) {
                const data = await res.json()
                setCategories(data)
            }
        } catch (error) {
            console.error('Failed to fetch categories', error)
            // Fallback (optional, maybe not needed if seeded correctly)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const getCategoryName = (id: string) => {
        const category = categories.find(c => c.id === id)
        if (category) return category.name

        const systemCategory = EXPENSE_CATEGORIES.find(c => c.id === id)
        return systemCategory?.name || 'Inne'
    }


    const getCategoryIcon = (id: string) => {
        const category = categories.find(c => c.id === id)
        if (category) return category.icon

        const systemCategory = EXPENSE_CATEGORIES.find(c => c.id === id)
        return systemCategory?.icon || '📦'
    }

    const getCategoryById = (id: string) => {
        return categories.find(c => c.id === id)
    }

    const getCategoriesForEnvelope = (envelopeName: string) => {
        return categories.filter(c => c.defaultEnvelope === envelopeName)
    }

    const addCategory = async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
        try {
            const response = await authorizedFetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(category)
            })
            if (response.ok) {
                await fetchCategories()
            } else {
                throw new Error('Failed to add category')
            }
        } catch (error) {
            console.error('Error adding category:', error)
            throw error
        }
    }

    const updateCategory = async (id: string, updates: Partial<Category>) => {
        try {
            const response = await authorizedFetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })
            if (response.ok) {
                await fetchCategories()
            } else {
                throw new Error('Failed to update category')
            }
        } catch (error) {
            console.error('Error updating category:', error)
            throw error
        }
    }

    const deleteCategory = async (id: string) => {
        try {
            const response = await authorizedFetch(`/api/categories/${id}`, {
                method: 'DELETE'
            })
            if (response.ok) {
                await fetchCategories()
            } else {
                throw new Error('Failed to delete category')
            }
        } catch (error) {
            console.error('Error deleting category:', error)
            throw error
        }
    }

    return (
        <CategoryContext.Provider value={{
            categories,
            loading,
            refreshCategories: fetchCategories,
            getCategoryName,
            getCategoryIcon,
            getCategoryById,
            getCategoriesForEnvelope,
            addCategory,
            updateCategory,
            deleteCategory
        }}>
            {children}
        </CategoryContext.Provider>
    )
}

export function useCategories() {
    const context = useContext(CategoryContext)
    if (context === undefined) {
        throw new Error('useCategories must be used within a CategoryProvider')
    }
    return context
}
